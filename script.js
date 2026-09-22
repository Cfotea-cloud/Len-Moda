const SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgmrR8L46VQtyuEsnmPMmzmZxG_9MxwJNIw7Ttq6h0I1z2_kuW_LJ6caaFOEjSe4elKFl6oy0nMQBn/pub?output=csv";

const WHATSAPP_NUMBER = "5491150395940";

 

let products = [];

let activeFilter = "TODOS";

 

const normalize = value => String(value ?? "").trim();

const key = value => normalize(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

const isYes = value => ["SI", "SÍ", "TRUE", "1"].includes(key(value));

 

function parseCSV(text) {

  const rows = []; let row = [], cell = "", quoted = false;

  for (let i = 0; i < text.length; i++) {

    const char = text[i], next = text[i + 1];

    if (char === '"' && quoted && next === '"') { cell += '"'; i++; }

    else if (char === '"') quoted = !quoted;

    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }

    else if ((char === '\n' || char === '\r') && !quoted) {

      if (char === '\r' && next === '\n') i++;

      row.push(cell); if (row.some(v => v.trim() !== "")) rows.push(row); row = []; cell = "";

    } else cell += char;

  }

  if (cell.length || row.length) { row.push(cell); rows.push(row); }

  if (!rows.length) return [];

  const headers = rows[0].map(key);

  return rows.slice(1).map(values => Object.fromEntries(headers.map((h, i) => [h, normalize(values[i])])));

}

 

function driveImageUrl(url) {

  const value = normalize(url);

  if (!value) return "";

  const idMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/) || value.match(/[?&]id=([a-zA-Z0-9_-]+)/);

  return idMatch ? `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1200` : value;

}

 

function money(value) {

  const number = Number(String(value).replace(/[^0-9,.-]/g, "").replace(",", "."));

  return Number.isFinite(number) ? new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(number) : value;

}

 

function adapt(row) {

  return {

    id: row.ID, name: row.NOMBRE, gender: row.GENERO, category: row.CATEGORIA,

    price: row.PRECIO, description: row.DESCRIPCION, image: driveImageUrl(row["FOTO URL"]),

    featured: isYes(row.DESTACADO), isNew: isYes(row.NUEVO), visible: isYes(row.VISIBLE),

    size: row.TALLE, color: row.COLOR, date: row["FECHA DE CARGA"]

  };

}

 

function whatsappUrl(product) {

  const message = `Hola! Vi el producto ${product.name} (ID ${product.id}) en LEN MODA. ¿Continúa disponible?`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

}

 

function card(product) {

  const node = document.querySelector("#product-template").content.cloneNode(true);

  const img = node.querySelector(".product-image");

  img.src = product.image || "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='100%' height='100%' fill='#eee8dd'/><text x='50%' y='50%' text-anchor='middle' fill='#746f66' font-family='Arial' font-size='34'>LEN MODA</text></svg>`);

  img.alt = product.name;

  img.onerror = () => { img.onerror = null; img.src = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='100%' height='100%' fill='#eee8dd'/><text x='50%' y='50%' text-anchor='middle' fill='#746f66' font-family='Arial' font-size='30'>Imagen no disponible</text></svg>`); };

  node.querySelector(".product-category").textContent = `${product.gender} · ${product.category}`;

  node.querySelector(".product-name").textContent = product.name;

  node.querySelector(".product-description").textContent = product.description || "Consultá detalles y disponibilidad.";

  node.querySelector(".product-price").textContent = money(product.price);

  node.querySelector(".whatsapp-link").href = whatsappUrl(product);

  const badges = node.querySelector(".badges");

  if (product.isNew) badges.insertAdjacentHTML("beforeend", '<span class="badge">NUEVO</span>');

  if (product.featured) badges.insertAdjacentHTML("beforeend", '<span class="badge">DESTACADO</span>');

  const meta = node.querySelector(".product-meta");

  if (product.size) meta.insertAdjacentHTML("beforeend", `<span class="meta-pill">Talle ${escapeHTML(product.size)}</span>`);

  if (product.color) meta.insertAdjacentHTML("beforeend", `<span class="meta-pill">${escapeHTML(product.color)}</span>`);

  return node;

}

 

function escapeHTML(value) { const div = document.createElement("div"); div.textContent = value; return div.innerHTML; }

 

function renderGrid(element, list) { element.innerHTML = ""; list.forEach(item => element.appendChild(card(item))); }

 

function setupFilters() {

  const values = ["TODOS", "MUJER", "HOMBRE", ...new Set(products.map(p => key(p.category)).filter(Boolean))];

  const filters = document.querySelector("#filters"); filters.innerHTML = "";

  [...new Set(values)].forEach(value => {

    const button = document.createElement("button"); button.className = `filter-btn ${value === activeFilter ? "active" : ""}`;

    button.textContent = value.charAt(0) + value.slice(1).toLowerCase();

    button.onclick = () => { activeFilter = value; setupFilters(); renderCatalog(); };

    filters.appendChild(button);

  });

}

 

function renderCatalog() {

  const query = key(document.querySelector("#search").value);

  const filtered = products.filter(p => {

    const filterMatch = activeFilter === "TODOS" || key(p.gender) === activeFilter || key(p.category) === activeFilter;

    const searchMatch = !query || key(`${p.name} ${p.gender} ${p.category} ${p.color} ${p.description}`).includes(query);

    return filterMatch && searchMatch;

  });

  renderGrid(document.querySelector("#catalog-grid"), filtered);

  document.querySelector("#product-count").textContent = `${filtered.length} producto${filtered.length === 1 ? "" : "s"}`;

  document.querySelector("#status").textContent = filtered.length ? "" : "No encontramos productos con esos filtros.";

}

 

async function init() {

  try {

    const response = await fetch(SHEET_CSV_URL, { cache: "no-store" });

    if (!response.ok) throw new Error(`Error ${response.status}`);

    const rows = parseCSV(await response.text());

    products = rows.map(adapt).filter(p => p.name && p.visible);

    if (!products.length) throw new Error("La hoja no devolvió productos visibles.");

    renderGrid(document.querySelector("#featured-grid"), products.filter(p => p.featured || p.isNew).slice(0, 4));

    setupFilters(); renderCatalog();

  } catch (error) {

    console.error(error);

    document.querySelector("#status").innerHTML = "No se pudo cargar el catálogo. Verificá que la hoja continúe publicada y que las fotos sean enlaces públicos.";

    document.querySelector("#featured-grid").innerHTML = "";

  }

}

 

document.querySelector("#search").addEventListener("input", renderCatalog);

init();