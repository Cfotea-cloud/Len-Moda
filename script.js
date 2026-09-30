const SHEET_ID="1ZmqzWKuMgQnqzEG3DTyBjHRePkxTy8mhc_d0_pOuitc";

const csvUrl=sheet=>`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}`;

const FALLBACK={WHATSAPP:"5491150395940",INSTAGRAM:"lenmoda",INSTAGRAM_URL:"https://www.instagram.com"/,FACEBOOK_URL:"https://www.facebook.com/",HERO_URL:""};

const FALLBACK_HERO="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=2200&q=85";

let products=[],variants=[],config={},active="TODOS",selectedProduct=null,selectedVariant=null,currentPhoto=0;

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],norm=v=>String(v??"").trim(),key=v=>norm(v).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase(),yes=v=>["SI","SÍ","TRUE","1"].includes(key(v));

function parseCSV(text){const rows=[];let row=[],cell="",quoted=false;for(let i=0;i<text.length;i++){const ch=text[i],next=text[i+1];if(ch==='"'&&quoted&&next==='"'){cell+='"';i++}else if(ch==='"')quoted=!quoted;else if(ch===','&&!quoted){row.push(cell);cell=""}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&next==='\n')i++;row.push(cell);if(row.some(v=>v.trim()))rows.push(row);row=[];cell=""}else cell+=ch}if(cell||row.length){row.push(cell);rows.push(row)}if(!rows.length)return[];const headers=rows[0].map(key);return rows.slice(1).map(values=>Object.fromEntries(headers.map((h,i)=>[h,norm(values[i])])))}

async function load(sheet){const response=await fetch(csvUrl(sheet),{cache:"no-store"});if(!response.ok)throw Error(sheet);return parseCSV(await response.text())}

function image(url){const value=norm(url);const match=value.match(/\/d\/([\w-]+)/)||value.match(/[?&]id=([\w-]+)/);return match?`https://drive.google.com/thumbnail?id=${match[1]}&sz=w1600`:value}

function variantPhotos(v){return norm(v?.FOTOS_URL).split("|").map(image).filter(Boolean)}

function money(v){const n=Number(String(v).replace(/[^0-9,.-]/g,"").replace(",","."));return Number.isFinite(n)?new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",maximumFractionDigits:0}).format(n):v}

function getConfig(name){return config[key(name)]||FALLBACK[key(name)]||""}

function productVariants(id){return variants.filter(v=>v.ID_PRODUCTO===id&&yes(v.VISIBLE)&&(v.STOCK===""||Number(v.STOCK)>0))}

function mainPhotos(p){const v=productVariants(p.ID_PRODUCTO)[0];return variantPhotos(v)}

function safeImage(url){return url||"data:image/svg+xml;charset=UTF-8,"+encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><rect width='100%' height='100%' fill='#f7f3ed'/><text x='50%' y='50%' text-anchor='middle' fill='#706a64' font-family='Arial' font-size='32'>LEN MODA</text></svg>`)}

function waUrl(message="Hola! Quisiera consultar por los productos de LEN MODA."){return `https://wa.me/${getConfig("WHATSAPP")}?text=${encodeURIComponent(message)}`}

function createCard(p){const vs=productVariants(p.ID_PRODUCTO),photos=mainPhotos(p),node=$("#productTemplate").content.cloneNode(true),article=node.querySelector(".product-card"),open=node.querySelector(".product-open"),primary=node.querySelector(".primary-image"),secondary=node.querySelector(".secondary-image");primary.src=safeImage(photos[0]);secondary.src=safeImage(photos[1]||photos[0]);primary.alt=p.NOMBRE;secondary.alt=`Otra vista de ${p.NOMBRE}`;node.querySelector(".product-category").textContent=`${p.GENERO} · ${p.CATEGORIA}`;node.querySelector(".product-name").textContent=p.NOMBRE;const prices=vs.map(v=>Number(String(v.PRECIO).replace(/[^0-9.-]/g,""))).filter(Number.isFinite);node.querySelector(".product-price").textContent=prices.length?`Desde ${money(Math.min(...prices))}`:"Consultar";const badges=node.querySelector(".badges");if(yes(p.NUEVO))badges.insertAdjacentHTML("beforeend",'<span class="badge">NUEVO</span>');if(yes(p.DESTACADO))badges.insertAdjacentHTML("beforeend",'<span class="badge">FAVORITO</span>');const swatches=node.querySelector(".swatches");vs.slice(0,6).forEach(v=>{const s=document.createElement("span");s.className="swatch";s.title=v.COLOR;s.style.background=v.HEX_COLOR||"#ddd";swatches.append(s)});open.onclick=()=>openProduct(p);setTimeout(()=>observeReveal(article),0);return node}

function renderInto(container,list){container.innerHTML="";list.forEach(p=>container.append(createCard(p)))}

function filteredProducts(){const q=key($("#search").value);return products.filter(p=>yes(p.VISIBLE)&&productVariants(p.ID_PRODUCTO).length).filter(p=>(active==="TODOS"||key(p.GENERO)===active||key(p.CATEGORIA)===active)&&(!q||key(`${p.NOMBRE} ${p.GENERO} ${p.CATEGORIA} ${p.DESCRIPCION} ${productVariants(p.ID_PRODUCTO).map(v=>v.COLOR).join(" ")}`).includes(q)))}

function renderCatalog(){const list=filteredProducts();$("#count").textContent=`${list.length} producto${list.length===1?"":"s"}`;renderInto($("#grid"),list);$("#status").textContent=list.length?"":"No encontramos productos con esos filtros."}

function setupFilters(){const values=["TODOS","MUJER","HOMBRE",...products.map(p=>key(p.CATEGORIA))];$("#filters").innerHTML="";[...new Set(values.filter(Boolean))].forEach(value=>{const b=document.createElement("button");b.className=`filter ${value===active?"active":""}`;b.textContent=title(value);b.onclick=()=>{active=value;setupFilters();renderCatalog();document.querySelector("#catalogo").scrollIntoView()};$("#filters").append(b)})}

function title(v){return norm(v).toLowerCase().replace(/(^|\s)\S/g,x=>x.toUpperCase())}

function iconSVG(category){const k=key(category);if(k.includes("PANT")||k.includes("JEAN"))return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 5h16l3 38H25l-1-23-1 23H13z"/><path d="M17 12h14"/></svg>';if(k.includes("ACCES"))return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 18h28l-2 24H12z"/><path d="M17 18c0-10 14-10 14 0"/></svg>';if(k.includes("CALZ")||k.includes("ZAP"))return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 31c9 0 13-6 15-16l7 5c1 7 6 9 12 11v7H8z"/></svg>';if(k.includes("CAMP")||k.includes("BUZO")||k.includes("SWEAT"))return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 7l7 4 7-4 10 10-6 7v18H13V24l-6-7z"/><path d="M24 11v31"/></svg>';return '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 7l7 4 7-4 10 10-6 7v18H13V24l-6-7z"/></svg>'}

function setupCategories(){const cats=[...new Set(products.filter(p=>yes(p.VISIBLE)).map(p=>key(p.CATEGORIA)).filter(Boolean))].slice(0,5);const grid=$("#categoryGrid");grid.innerHTML="";cats.forEach(cat=>{const n=products.filter(p=>key(p.CATEGORIA)===cat&&yes(p.VISIBLE)).length,b=document.createElement("button");b.className="category-card";b.innerHTML=`<div class="category-icon">${iconSVG(cat)}</div><b>${title(cat)}</b><small>${n} producto${n===1?"":"s"}</small>`;b.onclick=()=>{active=cat;setupFilters();renderCatalog();$("#catalogo").scrollIntoView()};grid.append(b)})}

function openProduct(p,variantId){selectedProduct=p;const vs=productVariants(p.ID_PRODUCTO);selectedVariant=vs.find(v=>v.ID_VARIANTE===variantId)||vs[0];currentPhoto=0;$("#detailCategory").textContent=`${p.GENERO} · ${p.CATEGORIA}`;$("#detailName").textContent=p.NOMBRE;$("#detailDescription").textContent=p.DESCRIPCION||"Consultá detalles y disponibilidad.";renderVariant();$("#colors").innerHTML="";vs.forEach(v=>{const b=document.createElement("button");b.className=`option ${v.ID_VARIANTE===selectedVariant.ID_VARIANTE?"active":""}`;b.textContent=v.COLOR;b.onclick=()=>openProduct(p,v.ID_VARIANTE);$("#colors").append(b)});if(!$("#productDialog").open)$("#productDialog").showModal();document.body.classList.add("modal-open")}

function renderVariant(){const photos=variantPhotos(selectedVariant);setPhoto(0,photos);$("#detailPrice").textContent=money(selectedVariant.PRECIO);$("#sizes").innerHTML=norm(selectedVariant.TALLES).split("|").filter(Boolean).map(x=>`<span class="option">${x.trim()}</span>`).join("");$("#thumbs").innerHTML="";photos.forEach((url,i)=>{const im=document.createElement("img");im.src=safeImage(url);im.alt=`${selectedProduct.NOMBRE}, ${selectedVariant.COLOR}, vista ${i+1}`;im.className=i===0?"active":"";im.onclick=()=>setPhoto(i,photos);$("#thumbs").append(im)});const msg=`Hola! Vi ${selectedProduct.NOMBRE}, color ${selectedVariant.COLOR} (ID ${selectedProduct.ID_PRODUCTO}) en LEN MODA. ¿Sigue disponible?`;$("#detailWa").href=waUrl(msg)}

function setPhoto(index,photos=variantPhotos(selectedVariant)){if(!photos.length){$("#mainPhoto").src=safeImage("");return}currentPhoto=(index+photos.length)%photos.length;$("#mainPhoto").src=safeImage(photos[currentPhoto]);$("#mainPhoto").alt=`${selectedProduct.NOMBRE}, ${selectedVariant.COLOR}, vista ${currentPhoto+1}`;$$('#thumbs img').forEach((im,i)=>im.classList.toggle('active',i===currentPhoto))}

function setupInstagram(){const url=getConfig("INSTAGRAM_URL")||`https://www.instagram.com/${getConfig("INSTAGRAM")}/`;const handle=getConfig("INSTAGRAM")||"lenmoda";$("#instagramLink").href=url;$("#instagramLink").textContent=`@${handle.replace('@','')} →`;$("#footerInstagram").href=url;const images=products.filter(p=>yes(p.VISIBLE)).flatMap(mainPhotos).slice(0,6),grid=$("#instagramGrid");grid.innerHTML="";images.forEach((src,i)=>{const a=document.createElement("a");a.href=url;a.target="_blank";a.rel="noopener";a.setAttribute("aria-label","Ver LEN MODA en Instagram");a.innerHTML=`<img src="${safeImage(src)}" alt="Inspiración LEN MODA ${i+1}" loading="lazy">`;grid.append(a)})}

function setupConfig(){const wa=waUrl();["#headerWa","#heroWa","#floatingWa","#footerWa"].forEach(s=>$(s).href=wa);$("#footerFacebook").href=getConfig("FACEBOOK_URL")||"#";const hero=getConfig("HERO_URL");if(hero)$("#hero").style.backgroundImage=`url("${image(hero)}")`;setupInstagram()}

function observeReveal(el){if(!el)return;revealObserver.observe(el)}

const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");revealObserver.unobserve(e.target)}}),{threshold:.08});

async function init(){try{const [p,v,c]=await Promise.all([load("PRODUCTOS"),load("VARIANTES"),load("CONFIGURACION")]);products=p;variants=v;config=Object.fromEntries(c.map(x=>[key(x.CAMPO),x.VALOR]));setupConfig();renderInto($("#featuredCarousel"),products.filter(p=>yes(p.VISIBLE)&&yes(p.DESTACADO)&&productVariants(p.ID_PRODUCTO).length));renderInto($("#newCarousel"),products.filter(p=>yes(p.VISIBLE)&&yes(p.NUEVO)&&productVariants(p.ID_PRODUCTO).length));setupCategories();setupFilters();renderCatalog();$$('.reveal').forEach(observeReveal)}catch(error){console.error(error);$("#status").textContent="No se pudo cargar el catálogo. Verificá los nombres de las hojas, los permisos y las URLs."}}

$("#search").addEventListener("input",renderCatalog);$("#menuButton").onclick=()=>{const nav=$("#mainNav"),open=nav.classList.toggle("open");$("#menuButton").setAttribute("aria-expanded",open)};$("#mainNav").addEventListener("click",()=>$("#mainNav").classList.remove("open"));$$('[data-carousel]').forEach(b=>b.onclick=()=>{const target=b.dataset.carousel==='featured'?$("#featuredCarousel"):$("#newCarousel");target.scrollBy({left:Number(b.dataset.dir)*Math.min(target.clientWidth*.85,900),behavior:"smooth"})});$("#photoPrev").onclick=()=>setPhoto(currentPhoto-1);$("#photoNext").onclick=()=>setPhoto(currentPhoto+1);$("#closeDialog").onclick=()=>{$("#productDialog").close();document.body.classList.remove("modal-open")};$("#productDialog").addEventListener("close",()=>document.body.classList.remove("modal-open"));$("#productDialog").addEventListener("click",e=>{if(e.target===$("#productDialog"))$("#productDialog").close()});$("#year").textContent=new Date().getFullYear();init();