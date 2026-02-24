<?php
/**
 * EnsCookherichess - Advanced Restaurant Search API
 * Veritabanı sorguları ve coğrafi konum tabanlı arama.
 */

header('Content-Type: application/json');
require_once '../config.php';

try {
    $conn = getDBConnection();
    
    // Parametreleri al
    $query = $_GET['q'] ?? '';
    $category = $_GET['category'] ?? ''; // Örn: 'Kebap', 'Vegan'
    $price = $_GET['price'] ?? '';       // Örn: '₺₺'
    
    // Kullanıcı Konumu (Mesafe hesaplama için opsiyonel)
    $userLat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
    $userLng = isset($_GET['lng']) ? floatval($_GET['lng']) : null;

    // Temel SQL Sorgusu
    $sql = "SELECT *";
    
    // Eğer kullanıcı konumu varsa Haversine Formülü ile mesafe hesapla (km cinsinden)
    if ($userLat && $userLng) {
        $sql .= ", ( 6371 * acos( cos( radians(:lat) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(:lng) ) + sin( radians(:lat) ) * sin( radians( lat ) ) ) ) AS distance";
    } else {
        $sql .= ", 0 AS distance"; // Konum yoksa mesafe 0
    }
    
    $sql .= " FROM restaurants WHERE 1=1";
    $params = [];

    // Filtreleme Koşulları
    if (!empty($query)) {
        $sql .= " AND (name LIKE :query OR cuisine LIKE :query OR description LIKE :query)";
        $params[':query'] = "%$query%";
    }

    if (!empty($category) && $category !== 'Tümü') {
        // "Tümü" seçeneği hariç filtrele
        $sql .= " AND (cuisine LIKE :category OR description LIKE :category)";
        $params[':category'] = "%$category%";
    }

    if (!empty($price)) {
        $sql .= " AND price_range = :price";
        $params[':price'] = $price;
    }

    // Sıralama (Varsayılan: Puana göre, Konum varsa: Mesafeye göre)
    if ($userLat && $userLng) {
        $sql .= " ORDER BY distance ASC, rating DESC";
        $params[':lat'] = $userLat;
        $params[':lng'] = $userLng;
    } else {
        $sql .= " ORDER BY rating DESC";
    }

    // Sorguyu Çalıştır
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $restaurants = $stmt->fetchAll();

    // Yanıtı Döndür
    echo json_encode($restaurants);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Veritabanı hatası: ' . $e->getMessage()]);
}
?>