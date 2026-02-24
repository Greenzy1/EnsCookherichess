/**
 * EnsCookherichess - OpenStreetMap & Overpass Logic (No-Card Version)
 */
let map;
let markers = [];
let userLocation = { lat: 41.0082, lng: 28.9784 }; // Istanbul

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([userLocation.lat, userLocation.lng], 14);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Kullanıcı Konumu
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
            userLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            map.setView([userLocation.lat, userLocation.lng], 15);
            
            L.circleMarker([userLocation.lat, userLocation.lng], {
                radius: 10,
                fillColor: "#1A73E8",
                color: "#fff",
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map).bindPopup("Buradasın");

            fetchPlaces(); // Restoranları çek
        });
    }

    setupUI();
}

/**
 * Overpass API ile Restoranları Çekme
 */
async function fetchPlaces(filterType = 'restaurant') {
    const list = document.getElementById("resultsList");
    list.innerHTML = '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Çevredeki mekanlar taranıyor...</p></div>';

    // Overpass Query: Verilen koordinatın 2000m çevresindeki amenity=restaurant/cafe leri bul
    const radius = 2000;
    const query = `
        [out:json];
        (
          node["amenity"~"restaurant|cafe|fast_food"](around:${radius},${userLocation.lat},${userLocation.lng});
          way["amenity"~"restaurant|cafe|fast_food"](around:${radius},${userLocation.lat},${userLocation.lng});
        );
        out center;
    `;

    try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await response.json();
        const results = data.elements;

        clearMarkers();
        renderList(results);
    } catch (error) {
        console.error("Overpass Error:", error);
        list.innerHTML = '<p class="p-4 text-danger">Mekanlar yüklenemedi.</p>';
    }
}

function renderList(results) {
    const list = document.getElementById("resultsList");
    list.innerHTML = "";

    if (results.length === 0) {
        list.innerHTML = '<p class="p-5 text-center">Yakınlarda mekan bulunamadı.</p>';
        return;
    }

    results.forEach(place => {
        const name = place.tags.name || "İsimsiz Mekan";
        const type = place.tags.amenity || "Restoran";
        const cuisine = place.tags.cuisine || "Genel Mutfak";
        const lat = place.lat || place.center.lat;
        const lon = place.lon || place.center.lon;

        // Kart Oluştur
        const item = document.createElement("div");
        item.className = "restaurant-card";
        item.innerHTML = `
            <div class="card-img" style="background-color: #e8f0fe; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-utensils fa-2x text-primary"></i>
            </div>
            <div class="card-info">
                <h3>${name}</h3>
                <div class="meta">
                    <span class="type">${type.replace('_', ' ')}</span>
                </div>
                <p class="cuisine">${cuisine}</p>
            </div>
        `;
        
        item.onclick = () => {
            map.setView([lat, lon], 17);
            showDetails(place);
        };
        list.appendChild(item);

        // Marker Ekle
        const marker = L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${name}</b><br>${cuisine}`);
        marker.on('click', () => showDetails(place));
        markers.push(marker);
    });
}

function showDetails(place) {
    const panel = document.getElementById("detailPanel");
    const content = document.getElementById("detailContent");
    const tags = place.tags;

    content.innerHTML = `
        <div class="detail-header" style="background: var(--primary); display: flex; align-items: center; justify-content: center;">
             <i class="fas fa-store fa-5x text-white"></i>
             <button class="close-btn-overlay" onclick="togglePanel(false)"><i class="fas fa-arrow-left"></i></button>
        </div>
        <div class="p-4">
            <h2>${tags.name || 'İsimsiz Mekan'}</h2>
            <p class="text-muted"><i class="fas fa-map-marker-alt"></i> ${tags['addr:street'] || 'Adres bilgisi yok'} ${tags['addr:housenumber'] || ''}</p>
            <hr>
            <h5>Detaylar</h5>
            <ul class="list-unstyled">
                <li><strong>Mutfak:</strong> ${tags.cuisine || 'Belirtilmemiş'}</li>
                <li><strong>Çalışma Saatleri:</strong> ${tags.opening_hours || 'Bilinmiyor'}</li>
                <li><strong>Dış Mekan:</strong> ${tags.outdoor_seating === 'yes' ? 'Evet' : 'Hayır'}</li>
            </ul>
        </div>
    `;
    panel.classList.add("active");
    
    document.getElementById("askAiBtn").onclick = () => askAI(place);
}

async function askAI(place) {
    const aiBox = document.getElementById("aiResponse");
    aiBox.classList.remove("d-none");
    aiBox.innerHTML = "EnsAI analiz ediyor...";

    const result = await ApiService.askGemini({
        mode: 'analysis',
        place_name: place.tags.name,
        place_details: JSON.stringify(place.tags), // Tüm OSM etiketlerini gönder
        rating: "OSM (Kullanıcı yorumu yok)",
        reviews: []
    });
    
    aiBox.innerHTML = result.answer;
}

function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers = [];
}

function togglePanel(show) {
    document.getElementById("detailPanel").classList.toggle("active", show);
}

function setupUI() {
    document.getElementById("searchBtn").onclick = () => {
        const q = document.getElementById("searchInput").value;
        // Basitçe yeniden tara (Gerçekte Overpass query güncellenebilir)
        fetchPlaces(); 
    };

    document.getElementById("aiChatToggle").onclick = () => {
        document.getElementById("aiChatWindow").classList.toggle("d-none");
    };
}

window.onload = initMap;