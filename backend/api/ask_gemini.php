<?php
header('Content-Type: application/json');
require_once '../config.php';

$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    echo json_encode(['error' => 'Geçersiz veri.']);
    exit;
}

$prompt = "";

if ($input['mode'] === 'analysis') {
    $name = $input['place_name'];
    $address = $input['place_details'];
    $rating = $input['rating'];
    $reviews = implode("\n- ", $input['reviews'] ?? []);

    $prompt = "Sen bir gurme analiz uzmanısın. Şu mekan hakkında Google verilerine dayanarak kısa bir analiz yap:\n";
    $prompt .= "Mekan Adı: $name\nAdres: $address\nPuan: $rating\n";
    $prompt .= "Kullanıcı Yorumları:\n- $reviews\n\n";
    $prompt .= "Lütfen şu soruları yanıtla: Neden buraya gidilmeli? Mekanın atmosferi nasıl? (Kısa ve öz olsun).";
} else {
    $msg = $input['message'];
    $prompt = "Kullanıcı bir mekan arıyor: '$msg'. Ona öneride bulun ve samimi bir cevap ver.";
}

$postData = [
    "contents" => [["parts" => [["text" => $prompt]]]]
];

$ch = curl_init(GEMINI_API_URL . "?key=" . GEMINI_API_KEY);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($postData));

$response = curl_exec($ch);
$result = json_decode($response, true);
$aiText = $result['candidates'][0]['content']['parts'][0]['text'] ?? 'AI şu an meşgul.';

echo json_encode(['answer' => $aiText]);
?>