const SHEET_ID = "1ZmqzWKuMgQnqzEG3DTyBjHRePkxTy8mhc_d0_pOuitc";

 

const csvUrl = (sheet) =>

`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

 

const FALLBACK = {

  WHATSAPP: "5491150395940",

  INSTAGRAM: "lenmoda",

  INSTAGRAM_URL: "https://www.instagram.com/",

  FACEBOOK_URL: "https://www.facebook.com/",

  HERO_URL: ""

};

 

let products = [];

let variants = [];

let config = {};

let active = "TODOS";

let selectedProduct = null;

let selectedVariant = null;

let currentPhoto = 0;

 

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => [...document.querySelectorAll(selector)];

const norm = (value) => String(value ?? "").trim();

 

const key = (value) =>

  norm(value)

    .normalize("NFD")

    .replace(/[\u0300-\u036f]/g, "")

    .toUpperCase();

 

const yes = (value) => ["SI", "SÍ", "TRUE", "1"].includes(key(value));

 

function parseCSV(text) {

  const rows = [];

  let row = [];

  let cell = "";

  let quoted = false;

 

  for (let i = 0; i < text.length; i += 1) {

    const char = text[i];

    const next = text[i + 1];

 

    if (char === '"' && quoted && next === '"') {

      cell += '"';

      i += 1;

    } else if (char === '"') {

      quoted = !quoted;

    } else if (char === "," && !quoted) {

      row.push(cell);

      cell = "";

    } else if ((char === "\n" || char === "\r") && !quoted) {

      if (char === "\r" && next === "\n") i += 1;

      row.push(cell);

      if (row.some((value) => value.trim() !== "")) rows.push(row);

      row = [];

      cell = "";

    } else {

      cell += char;

    }

  }

 

  if (cell !== "" || row.length) {

    row.push(cell);

    rows.push(row);

  }

 

  if (!rows.length) return [];

 

  const headers = rows[0].map(key);

  return rows.slice(1).map((values) =>

    Object.fromEntries(headers.map((header, index) => [header, norm(values[index])]))

  );

}

 

async function loadSheet(sheet) {

  const response = await fetch(csvUrl(sheet), { cache: "no-store" });

  if (!response.ok) throw new Error(`No se pudo cargar la hoja ${sheet}: ${response.status}`);

  return parseCSV(await response.text());

}

 

function driveFileId(url) {

  const value = norm(url);

  const fromPath = value.match(/\/file\/d\/([A-Za-z0-9_-]+)/);

  const fromId = value.match(/[?&]id=([A-Za-z0-9_-]+)/);

  return fromPath?.[1] || fromId?.[1] || "";

}

 

function imageUrl(url) {

  const value = norm(url);

  if (!value) return "";

  const id = driveFileId(value);

  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1600` : value;

}

 

function variantPhotos(variant) {

  return norm(variant?.FOTOS_URL)

    .split("|")

    .map((url) => imageUrl(url))

    .filter(Boolean);

}

 

function placeholderImage() {

  const svg = `

    <svg xmlns=http://www.w3.org/2000/svg width="800" height="1000">

      <rect width="100%" height="100%" fill="#f7f3ed"/>

      <text x="50%" y="50%" text-anchor="middle" fill="#706a64"

        font-family="Arial" font-size="32">LEN MODA</text>

    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

}

 

function safeImage(url) {

  return url || placeholderImage();

}

 

function money(value) {

  const number = Number(String(value).replace(/[^0-9,.-]/g, "").replace(",", "."));

  return Number.isFinite(number)

    ? new Intl.NumberFormat("es-AR", {

        style: "currency",

        currency: "ARS",

        maximumFractionDigits: 0

      }).format(number)

    : norm(value);

}

 

function getConfig(name) {

  return config[key(name)] || FALLBACK[key(name)] || "";

}

 

function productVariants(productId) {

  return variants.filter(

    (variant) =>

      norm(variant.ID_PRODUCTO) === norm(productId) &&

      yes(variant.VISIBLE) &&

      (norm(variant.STOCK) === "" || Number(variant.STOCK) > 0)

  );

}

 

function mainPhotos(product) {

  return variantPhotos(productVariants(product.ID_PRODUCTO)[0]);

}

 

function whatsappUrl(message = "Hola! Quisiera consultar por los productos de LEN MODA.") {

  return `https://wa.me/${getConfig("WHATSAPP")}?text=${encodeURIComponent(message)}`;

}

 

function createCard(product) {

  const availableVariants = productVariants(product.ID_PRODUCTO);

  const photos = mainPhotos(product);

  const node = $("#productTemplate").content.cloneNode(true);

  const article = node.querySelector(".product-card");

  const openButton = node.querySelector(".product-open");

  const primaryImage = node.querySelector(".primary-image");

  const secondaryImage = node.querySelector(".secondary-image");

 

  primaryImage.src = safeImage(photos[0]);

  secondaryImage.src = safeImage(photos[1] || photos[0]);

  primaryImage.alt = product.NOMBRE;

  secondaryImage.alt = `Otra vista de ${product.NOMBRE}`;

 

  primaryImage.onerror = () => {

    primaryImage.onerror = null;

    primaryImage.src = placeholderImage();

  };

  secondaryImage.onerror = () => {

    secondaryImage.onerror = null;

    secondaryImage.src = primaryImage.src;

  };

 

  node.querySelector(".product-category").textContent =

    `${product.GENERO} · ${product.CATEGORIA}`;

  node.querySelector(".product-name").textContent = product.NOMBRE;

 

  const prices = availableVariants

    .map((variant) => Number(String(variant.PRECIO).replace(/[^0-9.-]/g, "")))

    .filter(Number.isFinite);

 

  node.querySelector(".product-price").textContent = prices.length

    ? `Desde ${money(Math.min(...prices))}`

    : "Consultar";

 

  const badges = node.querySelector(".badges");

  if (yes(product.NUEVO)) {

    badges.insertAdjacentHTML("beforeend", '<span class="badge">NUEVO</span>');

  }

  if (yes(product.DESTACADO)) {

    badges.insertAdjacentHTML("beforeend", '<span class="badge">FAVORITO</span>');

  }

 

  const swatches = node.querySelector(".swatches");

  availableVariants.slice(0, 6).forEach((variant) => {

    const swatch = document.createElement("span");

    swatch.className = "swatch";

    swatch.title = variant.COLOR;

    swatch.style.background = variant.HEX_COLOR || "#ddd";

    swatches.append(swatch);

  });

 

  openButton.onclick = () => openProduct(product);

  setTimeout(() => observeReveal(article), 0);

  return node;

}

 

function renderInto(container, list) {

  if (!container) return;

  container.innerHTML = "";

  list.forEach((product) => container.append(createCard(product)));

}

 

function filteredProducts() {

  const searchInput = $("#search");

  const query = key(searchInput?.value || "");

 

  return products

    .filter((product) => yes(product.VISIBLE) && productVariants(product.ID_PRODUCTO).length)

    .filter((product) => {

      const matchesFilter =

        active === "TODOS" ||

        key(product.GENERO) === active ||

        key(product.CATEGORIA) === active;

 

      const searchable = key(

        `${product.NOMBRE} ${product.GENERO} ${product.CATEGORIA} ${product.DESCRIPCION} ` +

        productVariants(product.ID_PRODUCTO).map((variant) => variant.COLOR).join(" ")

      );

 

      return matchesFilter && (!query || searchable.includes(query));

    });

}

 

function renderCatalog() {

  const list = filteredProducts();

  if ($("#count")) {

    $("#count").textContent = `${list.length} producto${list.length === 1 ? "" : "s"}`;

  }

  renderInto($("#grid"), list);

  if ($("#status")) {

    $("#status").textContent = list.length

      ? ""

      : "No encontramos productos con esos filtros.";

  }

}

 

function title(value) {

  return norm(value)

    .toLowerCase()

    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());

}

 

function setupFilters() {

  const container = $("#filters");

  if (!container) return;

 

  const values = ["TODOS", "MUJER", "HOMBRE", ...products.map((p) => key(p.CATEGORIA))];

  container.innerHTML = "";

 

  [...new Set(values.filter(Boolean))].forEach((value) => {

    const button = document.createElement("button");

    button.className = `filter ${value === active ? "active" : ""}`;

    button.textContent = title(value);

    button.onclick = () => {

      active = value;

      setupFilters();

      renderCatalog();

      $("#catalogo")?.scrollIntoView({ behavior: "smooth" });

    };

    container.append(button);

  });

}

 

function iconSVG(category) {

  const categoryKey = key(category);

 

  if (categoryKey.includes("PANT") || categoryKey.includes("JEAN")) {

    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 5h16l3 38H25l-1-23-1 23H13z"/><path d="M17 12h14"/></svg>';

  }

  if (categoryKey.includes("ACCES")) {

    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 18h28l-2 24H12z"/><path d="M17 18c0-10 14-10 14 0"/></svg>';

  }

  if (categoryKey.includes("CALZ") || categoryKey.includes("ZAP")) {

    return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 31c9 0 13-6 15-16l7 5c1 7 6 9 12 11v7H8z"/></svg>';

  }

  return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 7l7 4 7-4 10 10-6 7v18H13V24l-6-7z"/></svg>';

}

 

function setupCategories() {

  const grid = $("#categoryGrid");

  if (!grid) return;

 

  const categories = [...new Set(

    products.filter((p) => yes(p.VISIBLE)).map((p) => key(p.CATEGORIA)).filter(Boolean)

  )].slice(0, 5);

 

  grid.innerHTML = "";

  categories.forEach((category) => {

    const count = products.filter(

      (product) => key(product.CATEGORIA) === category && yes(product.VISIBLE)

    ).length;

 

    const button = document.createElement("button");

    button.className = "category-card";

    button.innerHTML = `

      <div class="category-icon">${iconSVG(category)}</div>

      <b>${title(category)}</b>

      <small>${count} producto${count === 1 ? "" : "s"}</small>`;

    button.onclick = () => {

      active = category;

      setupFilters();

      renderCatalog();

      $("#catalogo")?.scrollIntoView({ behavior: "smooth" });

    };

    grid.append(button);

  });

}

 

function openProduct(product, variantId) {

  selectedProduct = product;

  const availableVariants = productVariants(product.ID_PRODUCTO);

  selectedVariant =

    availableVariants.find((variant) => variant.ID_VARIANTE === variantId) ||

    availableVariants[0];

 

  if (!selectedVariant) return;

 

  currentPhoto = 0;

  $("#detailCategory").textContent = `${product.GENERO} · ${product.CATEGORIA}`;

  $("#detailName").textContent = product.NOMBRE;

  $("#detailDescription").textContent =

    product.DESCRIPCION || "Consultá detalles y disponibilidad.";

 

  renderVariant();

 

  const colors = $("#colors");

  colors.innerHTML = "";

  availableVariants.forEach((variant) => {

    const button = document.createElement("button");

    button.className =

      `option ${variant.ID_VARIANTE === selectedVariant.ID_VARIANTE ? "active" : ""}`;

    button.textContent = variant.COLOR;

    button.onclick = () => openProduct(product, variant.ID_VARIANTE);

    colors.append(button);

  });

 

  const dialog = $("#productDialog");

  if (!dialog.open) dialog.showModal();

  document.body.classList.add("modal-open");

}

 

function renderVariant() {

  const photos = variantPhotos(selectedVariant);

  setPhoto(0, photos);

 

  $("#detailPrice").textContent = money(selectedVariant.PRECIO);

const sizes = norm(selectedVariant.TALLES)

  .split("|")

  .filter(Boolean);

window.selectedSize = sizes[0] || null;

$("#sizes").innerHTML = sizes

  .map(

    (size) =>

      `<button class="option size-option ${

        size === window.selectedSize ? "active" : ""

      }" data-size="${size}">

        ${size.trim()}

      </button>`

  )

  .join("");

document.querySelectorAll(".size-option").forEach((btn) => {

  btn.addEventListener("click", () => {

    document

      .querySelectorAll(".size-option")

      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");

    window.selectedSize = btn.dataset.size;

  });

});
 

  const thumbs = $("#thumbs");

  thumbs.innerHTML = "";

  photos.forEach((url, index) => {

    const img = document.createElement("img");

    img.src = safeImage(url);

    img.alt = `${selectedProduct.NOMBRE}, ${selectedVariant.COLOR}, vista ${index + 1}`;

    img.className = index === 0 ? "active" : "";

    img.onclick = () => setPhoto(index, photos);

    img.onerror = () => {

      img.onerror = null;

      img.src = placeholderImage();

    };

    thumbs.append(img);

  });

 

  const message =

    `Hola! Vi ${selectedProduct.NOMBRE}, color ${selectedVariant.COLOR} ` +

    `(ID ${selectedProduct.ID_PRODUCTO}) en LEN MODA. ¿Sigue disponible?`;

  $("#detailWa").href = whatsappUrl(message);

}

 

function setPhoto(index, photos = variantPhotos(selectedVariant)) {

  const mainPhoto = $("#mainPhoto");

  if (!photos.length) {

    mainPhoto.src = placeholderImage();

    return;

  }

 

  currentPhoto = (index + photos.length) % photos.length;

  mainPhoto.src = safeImage(photos[currentPhoto]);

  mainPhoto.alt =

    `${selectedProduct.NOMBRE}, ${selectedVariant.COLOR}, vista ${currentPhoto + 1}`;

  mainPhoto.onerror = () => {

    mainPhoto.onerror = null;

    mainPhoto.src = placeholderImage();

  };

 

  $$("#thumbs img").forEach((img, imgIndex) => {

    img.classList.toggle("active", imgIndex === currentPhoto);

  });

}

 

function setupInstagram() {

  const handle = getConfig("INSTAGRAM") || "lenmoda";

  const url =

    getConfig("INSTAGRAM_URL") ||

    `https://www.instagram.com/${handle.replace("@", "")}/`;

 

  if ($("#instagramLink")) {

    $("#instagramLink").href = url;

    $("#instagramLink").textContent = `@${handle.replace("@", "")} →`;

  }

  if ($("#footerInstagram")) $("#footerInstagram").href = url;

 

  const grid = $("#instagramGrid");

  if (!grid) return;

 

  const images = products

    .filter((product) => yes(product.VISIBLE))

    .flatMap(mainPhotos)

    .slice(0, 6);

 

  grid.innerHTML = "";

  images.forEach((src, index) => {

    const link = document.createElement("a");

    link.href = url;

    link.target = "_blank";

    link.rel = "noopener";

    link.setAttribute("aria-label", "Ver LEN MODA en Instagram");

    link.innerHTML =

      `<img src="${safeImage(src)}" alt="Inspiración LEN MODA ${index + 1}" loading="lazy">`;

    grid.append(link);

  });

}

 

function setupConfig() {

  const wa = whatsappUrl();

  ["#headerWa", "#heroWa", "#floatingWa", "#footerWa"].forEach((selector) => {

    const element = $(selector);

    if (element) element.href = wa;

  });

 

  if ($("#footerFacebook")) {

    $("#footerFacebook").href = getConfig("FACEBOOK_URL") || "#";

  }

 

  const hero = getConfig("HERO_URL");

  if (hero && $("#hero")) {

    $("#hero").style.backgroundImage = `url("${imageUrl(hero)}")`;

  }

 

  setupInstagram();

}

 

const revealObserver = new IntersectionObserver(

  (entries) => {

    entries.forEach((entry) => {

      if (entry.isIntersecting) {

        entry.target.classList.add("visible");

        revealObserver.unobserve(entry.target);

      }

    });

  },

  { threshold: 0.08 }

);

 

function observeReveal(element) {

  if (element) revealObserver.observe(element);

}

 

async function init() {

  try {

    const [productRows, variantRows, configRows] = await Promise.all([

      loadSheet("PRODUCTOS"),

      loadSheet("VARIANTES"),

      loadSheet("CONFIGURACION")

    ]);

 

    products = productRows;

    variants = variantRows;

    config = Object.fromEntries(

      configRows.map((row) => [key(row.CAMPO), norm(row.VALOR)])

    );

 

    setupConfig();

 

    renderInto(

      $("#featuredCarousel"),

      products.filter(

        (product) =>

          yes(product.VISIBLE) &&

          yes(product.DESTACADO) &&

          productVariants(product.ID_PRODUCTO).length

      )

    );

 

    renderInto(

      $("#newCarousel"),

      products.filter(

        (product) =>

          yes(product.VISIBLE) &&

          yes(product.NUEVO) &&

          productVariants(product.ID_PRODUCTO).length

      )

    );

 

    setupCategories();

    setupFilters();

    renderCatalog();

    $$(".reveal").forEach(observeReveal);

  } catch (error) {

    console.error("Error al iniciar LEN MODA:", error);

    if ($("#status")) {

      $("#status").textContent =

        "No se pudo cargar el catálogo. Revisá la publicación y los nombres de las hojas.";

    }

  }

}

 

$("#search")?.addEventListener("input", renderCatalog);

 

$("#menuButton")?.addEventListener("click", () => {

  const nav = $("#mainNav");

  const open = nav.classList.toggle("open");

  $("#menuButton").setAttribute("aria-expanded", open);

});

 

$("#mainNav")?.addEventListener("click", () => {

  $("#mainNav").classList.remove("open");

});

 

$$('[data-carousel]').forEach((button) => {

  button.onclick = () => {

    const target =

      button.dataset.carousel === "featured"

        ? $("#featuredCarousel")

        : $("#newCarousel");

    target?.scrollBy({

      left: Number(button.dataset.dir) * Math.min(target.clientWidth * 0.85, 900),

      behavior: "smooth"

    });

  };

});

 

$("#photoPrev")?.addEventListener("click", () => setPhoto(currentPhoto - 1));

$("#photoNext")?.addEventListener("click", () => setPhoto(currentPhoto + 1));

 

$("#closeDialog")?.addEventListener("click", () => {

  $("#productDialog").close();

});

 

$("#productDialog")?.addEventListener("close", () => {

  document.body.classList.remove("modal-open");

});

 

$("#productDialog")?.addEventListener("click", (event) => {

  if (event.target === $("#productDialog")) $("#productDialog").close();

});

 

if ($("#year")) $("#year").textContent = new Date().getFullYear();

 

init();