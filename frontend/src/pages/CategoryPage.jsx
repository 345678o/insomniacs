import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Preloader from "../helper/Preloader";
import HeaderTwo from "../components/HeaderTwo";
import FooterOne from "../components/FooterOne";
import BottomFooter from "../components/BottomFooter";
import ColorInit from "../helper/ColorInit";
import ScrollToTop from "react-scroll-to-top";
import { CATEGORIES, getCategory, getProductsByCategory } from "../data/products";

/* ── Inline SVG bottles — visual language carried from the homepage ────── */
const BottleArt = ({ shape = "tall", label, lot }) => {
  const paths = {
    tall:  "M -38 0 Q -38 -120 -22 -150 L 22 -150 Q 38 -120 38 0 Z",
    round: "M -50 0 Q -56 -70 -36 -110 Q -10 -136 0 -140 Q 10 -136 36 -110 Q 56 -70 50 0 Z",
    squat: "M -52 0 Q -52 -60 -36 -82 L 36 -82 Q 52 -60 52 0 Z",
  };
  const capY = shape === "round" ? -140 : (shape === "squat" ? -82 : -150);
  const id = `cat-bg-${shape}-${(label || "x").replace(/\W+/g, "")}`;
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
        <rect x="-40" y="-22" width="80" height="44" fill="#EFE7D6" />
        <rect x="-40" y="-22" width="80" height="44" fill="none" stroke="#8E7042" strokeOpacity="0.4" strokeWidth="0.4" />
        <text x="0" y="-6" textAnchor="middle" fontFamily="Fraunces, serif" fontStyle="italic" fontSize="10" fill="#3C1518">{(label || "").slice(0, 14)}</text>
        <line x1="-22" y1="0" x2="22" y2="0" stroke="#8E7042" strokeOpacity="0.5" strokeWidth="0.3" />
        <text x="0" y="12" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="5" letterSpacing="1.6" fill="#8E7042">{lot}</text>
      </g>
    </svg>
  );
};

const HeroSprig = () => (
  <svg viewBox="0 0 220 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M0 60 Q 80 40 110 40 Q 140 40 220 60" stroke="#C5A572" strokeOpacity=".6" strokeWidth="0.6" fill="none"/>
    <g fill="#7A8A5C" fillOpacity=".55">
      <path d="M30 56 C 20 50 14 38 22 32 C 28 38 32 48 30 56 Z"/>
      <path d="M58 50 C 50 44 46 32 54 26 C 60 32 62 42 58 50 Z"/>
      <path d="M168 56 C 178 50 184 38 176 32 C 170 38 166 48 168 56 Z"/>
      <path d="M196 50 C 204 44 208 32 200 26 C 194 32 192 42 196 50 Z"/>
    </g>
    <circle cx="110" cy="40" r="3" fill="#5A1E22"/>
  </svg>
);

const SORTS = [
  { id: "lunar",      label: "Lunar release" },
  { id: "newest",     label: "Newest first" },
  { id: "price-asc",  label: "Price · low to high" },
  { id: "price-desc", label: "Price · high to low" },
];

const parsePrice = (p) => Number((p || "").replace(/[^\d.]/g, "")) || 0;

const CategoryPage = () => {
  const { slug = "" } = useParams();
  const category = getCategory(slug);
  const allProducts = getProductsByCategory(slug);
  const [sort, setSort] = useState("lunar");

  const products = useMemo(() => {
    const arr = [...allProducts];
    if (sort === "price-asc") arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === "price-desc") arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    return arr;
  }, [allProducts, sort]);

  const display = category?.label || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Catalogue";
  const tagline = category?.tagline || "Edited in the small hours by hand.";
  const firstWord = display.split(" ")[0];
  const restWords = display.split(" ").slice(1).join(" ");

  return (
    <>
      <Preloader />
      <ScrollToTop smooth color="#5A1E22" />
      <ColorInit color={false} />
      <HeaderTwo />

      {/* HERO */}
      <section className="noct-cat-hero">
        <div className="container container-lg">
          <div className="noct-cat-hero__inner">
            <div className="noct-cat-hero__rail">
              <span className="noct-cat-hero__label">Catalogue / Catégorie</span>
              <ul className="noct-cat-hero__breadcrumb">
                <li><Link to="/">Maison</Link></li>
                <li>›</li>
                <li><Link to="/shop">Editions</Link></li>
                <li>›</li>
                <li><b>{display}</b></li>
              </ul>
            </div>
            <h1 className="noct-cat-hero__title">
              <em>{firstWord}</em>{restWords ? " " + restWords : ""}
            </h1>
            <div className="noct-cat-hero__sprig"><HeroSprig /></div>
            <p className="noct-cat-hero__sub">{tagline}</p>
          </div>
        </div>
      </section>

      <section className="noct-cat-body">
        <div className="container container-lg">
          <div className="row gy-4">
            {/* LEFT RAIL */}
            <aside className="col-lg-3">
              <div className="noct-cat-rail">
                <h6 className="noct-cat-rail__title">Categories</h6>
                <ul className="noct-cat-rail__list">
                  {CATEGORIES.map((c) => (
                    <li key={c.slug}>
                      <Link
                        to={`/category/${c.slug}`}
                        className={c.slug === slug ? "is-active" : ""}
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="noct-cat-rail">
                <h6 className="noct-cat-rail__title">Price · in £</h6>
                <div className="noct-cat-rail__price">
                  <div className="noct-cat-rail__price-track">
                    <span style={{ width: "62%" }} />
                  </div>
                  <div className="noct-cat-rail__price-marks">
                    <span>£28</span>
                    <span>£684</span>
                  </div>
                </div>
              </div>

              <div className="noct-cat-rail">
                <h6 className="noct-cat-rail__title">Filter by</h6>
                <ul className="noct-cat-rail__chips">
                  {["In stock", "Made-to-order", "Last lot", "New", "Boxed"].map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </div>
            </aside>

            {/* PRODUCT GRID */}
            <div className="col-lg-9">
              <div className="noct-cat-toolbar">
                <div className="noct-cat-toolbar__count">
                  <b>{String(products.length).padStart(2, "0")}</b>
                  &nbsp;editions in&nbsp;<em>{display}</em>
                </div>
                <div className="noct-cat-toolbar__sort">
                  <span>Sort</span>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}>
                    {SORTS.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="empty-cart">
                  <p>No editions found in this category yet.</p>
                  <p style={{ marginTop: 12, fontSize: 14, color: "#8E7042" }}>
                    Try one of the categories on the left, or visit the
                    <Link to="/shop" style={{ color: "#5A1E22", padding: "0 6px" }}>full catalogue</Link>.
                  </p>
                </div>
              ) : (
                <div className="noct-cat-grid">
                  {products.map((p, i) => (
                    <article className="noct-cat-card" key={p.id}>
                      <Link to={`/product/${p.id}`} className="noct-cat-card__image">
                        <span className="noct-cat-card__lot">{`LOT N.0${(i % 8) + 1}—${"ABCDEFGHI"[i % 9]}`}</span>
                        <span className="noct-cat-card__num">{`N° ${i + 1}`}</span>
                        {p.badge && <span className="noct-cat-card__chip">{p.badge}</span>}
                        <BottleArt shape={p.shape} label={p.name.split(" ")[0]} lot={`N.0${(i % 8) + 1}`} />
                      </Link>
                      <div className="noct-cat-card__body">
                        <span className="noct-cat-card__latin">{p.subtitle}</span>
                        <Link to={`/product/${p.id}`} className="noct-cat-card__title-link">
                          <h3 className="noct-cat-card__title">{p.name}</h3>
                        </Link>
                        <p className="noct-cat-card__notes">{p.description}</p>
                        <div className="noct-cat-card__foot">
                          <span className="noct-cat-card__price">
                            {p.price}
                            {p.oldPrice && <span className="noct-cat-card__crossed">{p.oldPrice}</span>}
                          </span>
                          <button
                            type="button"
                            className="product-card__cart noct-cat-card__acquire"
                            data-product={p.id}
                            data-product-name={p.name}
                          >
                            Acquire →
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {products.length > 6 && (
                <nav className="noct-cat-pagination" aria-label="Pagination">
                  <button className="is-active">01</button>
                  <button>02</button>
                  <button>Next →</button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </section>

      <FooterOne />
      <BottomFooter />
    </>
  );
};

export default CategoryPage;
