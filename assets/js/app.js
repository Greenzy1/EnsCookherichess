/**
 * EnsCookherichess - Google Maps Clone Logic
 */
let map;
let markers = [];
let userMarker = null;
let currentPlace = null;

// Başlangıç Konumu (İstanbul)
let mapCenter = { lat: 41.0082, lng: 28.9784 };

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    setupUI();
});

function initMap() {
    map = L.map('map', { zoomControl: false }).setView([mapCenter.lat, mapCenter.lng], 13);

    // Google Maps Benzeri Temiz Harita Katmanı (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Sağ Alt Zoom Kontrolü
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Konum İzni İste
    locateUser();
}

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                mapCenter = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                map.setView([mapCenter.lat, mapCenter.lng], 15);
                
                // Kullanıcı Marker (Mavi Nokta)
                if (userMarker) map.removeLayer(userMarker);
                userMarker = L.circleMarker([mapCenter.lat, mapCenter.lng], {
                    radius: 8,
                    fillColor: "#4285F4",
                    color: "#ffffff",
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 1
                }).addTo(map);

                // Otomatik Arama Başlat
                searchPlaces('restaurant');
            },
            () => console.log("Konum izni reddedildi.")
        );
    }
}

// --- ARAMA MANTIĞI (Nominatim Geocoding) ---
async function handleSearch() {
    const query = document.getElementById('searchInput').value;
    if (!query) return;

    // 1. Önce Konum Ara (Örn: "Besiktas")
    try {
        const geoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;
        const geoRes = await fetch(geoUrl);
        const geoData = await geoRes.json();

        if (geoData.length > 0) {
            // Haritayı Oraya Taşı
            const lat = parseFloat(geoData[0].lat);
            const lon = parseFloat(geoData[0].lon);
            map.setView([lat, lon], 15);
            mapCenter = { lat, lng: lon };
            
            // O Bölgedeki Restoranları Getir
            searchPlaces('restaurant'); 
        } else {
            // Konum bulunamadıysa, mevcut harita merkezinde kelime araması yap (Örn: "Burger")
            searchPlaces(query); 
        }
    } catch (e) {
        console.error("Arama hatası:", e);
    }
}

// --- MEKANLARI GETİR (Overpass API) ---
async function searchPlaces(queryType) {
    const list = document.getElementById('resultsList');
    const sidebar = document.getElementById('sidebarPanel');
    
    // Yükleniyor...
    sidebar.classList.add('active');
    list.innerHTML = '<div class="empty-state"><i class="fas fa-spinner fa-spin fa-2x"></i><p>Aranıyor...</p></div>';

    // Overpass Query (Etraftaki 1.5km)
    let amenityType = 'restaurant|cafe|fast_food';
    if (queryType === 'hotel') amenityType = 'hotel';
    if (queryType === 'supermarket') amenityType = 'supermarket';
    
    // Eğer spesifik bir kelime aranıyorsa (örn: "Burger") name filtresi ekle
    let nameFilter = '';
    if (!['restaurant', 'cafe', 'fast_food', 'hotel', 'supermarket'].includes(queryType)) {
        nameFilter = `[name~"${queryType}",i]`;
    }

    const overpassQuery = `
        [out:json][timeout:25];
        (
          node["amenity"~"${amenityType}"]${nameFilter}(around:1500,${mapCenter.lat},${mapCenter.lng});
          way["amenity"~"${amenityType}"]${nameFilter}(around:1500,${mapCenter.lat},${mapCenter.lng});
        );
        out center;
    `;

    try {
        const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`);
        const data = await response.json();
        
        renderResults(data.elements);
    } catch (error) {
        list.innerHTML = '<div class="empty-state"><p>Veri alınamadı.</p></div>';
    }
}

function renderResults(places) {
    const list = document.getElementById('resultsList');
    list.innerHTML = '';
    
    // Markerları Temizle
    markers.forEach(m => map.removeLayer(m));
    markers = [];

    if (places.length === 0) {
        list.innerHTML = '<div class="empty-state"><p>Bu bölgede sonuç bulunamadı.</p></div>';
        return;
    }

    places.forEach(place => {
        const lat = place.lat || place.center.lat;
        const lon = place.lon || place.center.lon;
        const name = place.tags.name || 'İsimsiz Mekan';
        const type = place.tags.amenity || 'Mekan';
        const address = place.tags['addr:street'] || 'Adres yok';

        // Listeye Ekle
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="result-icon"><i class="fas fa-utensils"></i></div>
            <div>
                <div style="font-weight:500">${name}</div>
                <div style="font-size:13px; color:#5f6368">${type} • ${address}</div>
                <div style="font-size:12px; color:#e7711b">★★★★☆ (OSM)</div>
            </div>
        `;
        div.onclick = () => openDetail(place);
        list.appendChild(div);

        // Haritaya Marker Ekle
        const marker = L.marker([lat, lon], {
            icon: L.divIcon({
                className: 'custom-pin',
                html: `<div style="background:#EA4335; width:12px; height:12px; border-radius:50%; border:2px solid white; box-shadow:0 2px 4px rgba(0,0,0,0.3)"></div>`,
                iconSize: [16, 16]
            })
        }).addTo(map);
        
        marker.on('click', () => openDetail(place));
        markers.push(marker);
    });
}

// --- DETAY PANELI & AI ---
function openDetail(place) {
    currentPlace = place;
    const panel = document.getElementById('detailPanel');
    const sidebar = document.getElementById('sidebarPanel');
    
    // Mobilde sidebar'ı kapat, detayı aç
    sidebar.classList.remove('active');
    panel.classList.add('active');

    // Bilgileri Doldur
    document.getElementById('placeName').innerText = place.tags.name || 'İsimsiz';
    document.getElementById('placeType').innerText = (place.tags.cuisine || place.tags.amenity).toUpperCase();
    document.getElementById('placeAddress').innerText = place.tags['addr:street'] || 'Adres bilgisi girilmemiş';
    document.getElementById('aiContent').innerText = 'Analiz için butona basın...';
    
    // Haritayı Ortala (Mobilde biraz yukarı kaydır ki panel kapatmasın)
    const lat = place.lat || place.center.lat;
    const lon = place.lon || place.center.lon;
    map.setView([lat + 0.002, lon], 16); 
}

function closeDetail() {
    document.getElementById('detailPanel').classList.remove('active');
    // Masaüstünde sidebar geri gelsin
    if (window.innerWidth > 768) {
        document.getElementById('sidebarPanel').classList.add('active');
    }
}

// AI Butonu
document.getElementById('triggerAiBtn').addEventListener('click', async () => {
    const aiBox = document.getElementById('aiContent');
    aiBox.innerText = 'EnsAI düşünüyor...';
    
    const result = await ApiService.askGemini({
        mode: 'analysis',
        place_name: currentPlace.tags.name,
        place_details: JSON.stringify(currentPlace.tags),
        rating: 'Bilinmiyor',
        reviews: []
    });
    
    aiBox.innerText = result.answer;
});

// UI Eventleri
function setupUI() {
    // Enter tuşu ile arama
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    
    // Filtre Chipleri
    document.querySelectorAll('.chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            searchPlaces(e.target.dataset.query);
        });
    });

    // Konum Butonu
    document.getElementById('locateBtn').addEventListener('click', locateUser);
    document.getElementById('directionBtn').addEventListener('click', locateUser);
}
