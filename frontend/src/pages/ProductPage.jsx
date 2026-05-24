import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Preloader from "../helper/Preloader";
import HeaderTwo from "../components/HeaderTwo";
import FooterOne from "../components/FooterOne";
import BottomFooter from "../components/BottomFooter";
import ColorInit from "../helper/ColorInit";
import ScrollToTop from "react-scroll-to-top";
import { fetchProduct, fetchProducts, fetchCategories, fetchSimilar } from "../lib/api";

const BottleArt = ({ shape = "tall", label, lot, large = false }) => {
  const paths = {
    tall:  "M -38 0 Q -38 -120 -22 -150 L 22 -150 Q 38 -120 38 0 Z",
    round: "M -50 0 Q -56 -70 -36 -110 Q -10 -136 0 -140 Q 10 -136 36 -110 Q 56 -70 50 0 Z",
    squat: "M -52 0 Q -52 -60 -36 -82 L 36 -82 Q 52 -60 52 0 Z",
  };
  const capY = shape === "round" ? -140 : (shape === "squat" ? -82 : -150);
  const id = `prod-${shape}-${(label || "x").replace(/\W+/g, "")}-${large ? "lg" : "sm"}`;
  return (
    <svg viewBox="-80 -180 160 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="#5A2024" />
          <stop offset="60%"  stopColor="#3C1518" />
          <stop offset="100%" stopColor="#1A0A0C" />
        </linearGradient>
      </defs>
      <rect x="-9" y={capY - 14} width="18" height="14" fill="#8E7042" />
      <rect x="-7" y={capY - 18} width="14" height="6"  fill="#C5A572" />
      <path d={paths[shape]} fill={`url(#${id})`} stroke="#C5A572" strokeOpacity="0.55" strokeWidth="0.8" />
      <g transform="translate(0 -60)">
        <rect x="-44" y="-24" width="88" height="48" fill="#EFE7D6" />
        <rect x="-44" y="-24" width="88" height="48" fill="none" stroke="#8E7042" strokeOpacity="0.4" strokeWidth="0.4" />
        <text x="0" y="-6" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="11" fill="#3C1518">{(label || "").slice(0, 14)}</text>
        <line x1="-26" y1="0" x2="26" y2="0" stroke="#8E7042" strokeOpacity="0.5" strokeWidth="0.3" />
        <text x="0" y="14" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="6" letterSpacing="1.6" fill="#8E7042">{lot}</text>
      </g>
    </svg>
  );
};

const fmtPrice = (p) =>
  typeof p === "number" ? `£${p % 1 === 0 ? p : p.toFixed(2)}` : (p || "");
const productSlug = (p) => p.slugId || p.slug || p.id || p.productId;

const ProductPage = () => {
  const { id = "" } = useParams();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProduct(null);
    setRelated([]);

    (async () => {
      try {
        const p = await fetchProduct(id);
        if (cancelled) return;
        if (!p) {
          setProduct(null);
          return;
        }
        setProduct(p);

        // Category meta + related — best-effort, don't block render.
        Promise.all([
          fetchCategories().then((cats) => cats.find((c) => c.slug === p.category) || null),
          // Prefer similar API; fall back to a category list.
          fetchSimilar(p.productId, 4).catch(() => null).then(async (sim) => {
            if (sim && sim.length) return sim;
            const page = await fetchProducts({ category: p.category, pageSize: 8 });
            return (page.items || []).filter((q) => q.productId !== p.productId).slice(0, 4);
          }),
        ]).then(([cat, rel]) => {
          if (cancelled) return;
          setCategory(cat);
          setRelated(rel || []);
        }).catch(() => { /* non-fatal */ });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <>
        <Preloader />
        <ColorInit color={false} />
        <HeaderTwo />
        <section className="noct-cat-body">
          <div className="container container-lg">
            <div className="empty-cart"><p>Loading edition…</p></div>
          </div>
        </section>
        <FooterOne />
        <BottomFooter />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Preloader />
        <ColorInit color={false} />
        <HeaderTwo />
        <section className="noct-cat-body">
          <div className="container container-lg">
            <div className="empty-cart">
              <p>{error ? `Catalogue error: ${error}` : "That edition isn't in the catalogue."}</p>
              <Link to="/shop" style={{ color: "#5A1E22", padding: "12px 0", display: "inline-block" }}>
                ← Return to the catalogue
              </Link>
            </div>
          </div>
        </section>
        <FooterOne />
        <BottomFooter />
      </>
    );
  }

  const lotId = (product.productId || "").slice(-3).toUpperCase() || "07A";

  return (
    <>
      <Preloader />
      <ScrollToTop smooth color="#5A1E22" />
      <ColorInit color={false} />
      <HeaderTwo />

      <section className="noct-product">
        <div className="container container-lg">
          {/* Breadcrumb */}
          <ul className="noct-product__breadcrumb">
            <li><Link to="/">Maison</Link></li>
            <li>›</li>
            <li><Link to="/shop">Editions</Link></li>
            <li>›</li>
            <li><Link to={`/category/${product.category}`}>{category?.label || product.category}</Link></li>
            <li>›</li>
            <li><b>{product.name}</b></li>
          </ul>

          <div className="row gy-5">
            {/* GALLERY */}
            <div className="col-lg-7">
              <div className="noct-product__gallery">
                <div className="noct-product__gallery-main">
                  <span className="noct-product__lot">{`LOT N.07 — ${lotId}`}</span>
                  <BottleArt shape={product.shape || "tall"} label={product.name.split(" ")[0]} lot="N.07" large />
                </div>
                <div className="noct-product__gallery-thumbs">
                  {["tall", "round", "squat"].map((s, i) => (
                    <button key={i} className={`noct-product__gallery-thumb ${s === (product.shape || "tall") ? "is-active" : ""}`}>
                      <BottleArt shape={s} label={product.name.split(" ")[0]} lot={`v.${i + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* INFO */}
            <div className="col-lg-5">
              <div className="noct-product__info">
                <span className="noct-product__category">
                  <Link to={`/category/${product.category}`}>{category?.label || product.category}</Link>
                  &nbsp;·&nbsp;Édition iv
                </span>
                <h1 className="noct-product__title">{product.name}</h1>
                <p className="noct-product__sub">{product.subtitle}</p>

                <div className="noct-product__rating">
                  <span aria-hidden="true">✦ ✦ ✦ ✦ ✦</span>
                  <small>{product.rating ?? 4.8} · {product.reviewCount ?? 124} letters of correspondence</small>
                </div>

                <div className="noct-product__price">
                  <span className="noct-product__price-main">{fmtPrice(product.price)}</span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="noct-product__price-old">{fmtPrice(product.originalPrice)}</span>
                  )}
                  {product.badge && <span className="noct-product__price-chip">{product.badge}</span>}
                </div>

                <p className="noct-product__desc">{product.description}</p>

                <ul className="noct-product__facts">
                  <li><span>Hand-numbered</span><b>Yes</b></li>
                  <li><span>Atelier</span><b>Hackney Wick · E15</b></li>
                  <li><span>Lot</span><b>{`N.${lotId}`}</b></li>
                  <li><span>In stock</span><b>{product.inStock ? `${product.stock} on shelf` : "Out of stock"}</b></li>
                  <li><span>Ships within</span><b>3–5 working days</b></li>
                </ul>

                <div className="noct-product__qty">
                  <span className="noct-product__qty-label">Quantity</span>
                  <div className="noct-product__qty-control">
                    <button type="button" aria-label="decrease" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <input type="text" value={qty} readOnly aria-label="quantity" />
                    <button type="button" aria-label="increase" onClick={() => setQty((q) => q + 1)}>+</button>
                  </div>
                </div>

                <div className="noct-product__actions">
                  <button
                    type="button"
                    className="product-card__cart noct-product__acquire"
                    data-product={productSlug(product)}
                    data-product-name={product.name}
                  >
                    Acquire — {fmtPrice(product.price)}
                  </button>
                  <button
                    type="button"
                    className="noct-product__wishlist"
                    aria-label="Add to wishlist"
                  >
                    <i className="ph ph-heart" aria-hidden="true" /> Save
                  </button>
                </div>

                <p className="noct-product__post">
                  Free post within the British Isles on orders over £140 · returns within 30 days
                </p>
              </div>
            </div>
          </div>

          {/* RELATED */}
          {related.length > 0 && (
            <section className="noct-product__related">
              <div className="noct-product__related-head">
                <h2>You may also <em>regard</em></h2>
                <Link to={`/category/${product.category}`} className="noct-product__related-link">
                  All of {category?.label || product.category} →
                </Link>
              </div>
              <div className="noct-cat-grid">
                {related.map((p, i) => (
                  <article className="noct-cat-card" key={p.productId || p.id}>
                    <Link to={`/product/${productSlug(p)}`} className="noct-cat-card__image">
                      <span className="noct-cat-card__lot">{`LOT N.0${(i % 8) + 1}`}</span>
                      <span className="noct-cat-card__num">{`N° ${i + 1}`}</span>
                      {p.badge && <span className="noct-cat-card__chip">{p.badge}</span>}
                      <BottleArt shape={p.shape || "tall"} label={p.name.split(" ")[0]} lot={`N.0${(i % 8) + 1}`} />
                    </Link>
                    <div className="noct-cat-card__body">
                      <span className="noct-cat-card__latin">{p.subtitle}</span>
                      <Link to={`/product/${productSlug(p)}`} className="noct-cat-card__title-link">
                        <h3 className="noct-cat-card__title">{p.name}</h3>
                      </Link>
                      <div className="noct-cat-card__foot">
                        <span className="noct-cat-card__price">{fmtPrice(p.price)}</span>
                        <button
                          type="button"
                          className="product-card__cart noct-cat-card__acquire"
                          data-product={productSlug(p)}
                          data-product-name={p.name}
                        >
                          Acquire →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      <FooterOne />
      <BottomFooter />
    </>
  );
};

export default ProductPage;
