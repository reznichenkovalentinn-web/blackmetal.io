<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'message' => 'Метод не підтримується']);
    exit;
}

$configFile = __DIR__ . '/telegram-config.php';
if (!is_file($configFile)) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'message' => 'Telegram не налаштовано']);
    exit;
}

$config = require $configFile;
$name = trim((string)($_POST['name'] ?? ''));
$phone = trim((string)($_POST['phone'] ?? ''));
$description = trim((string)($_POST['description'] ?? ''));
$website = trim((string)($_POST['website'] ?? ''));

if ($website !== '') {
    echo json_encode(['ok' => true]);
    exit;
}
if ($name === '' || mb_strlen($name) > 80 || !preg_match('/^[+0-9()\s-]{10,24}$/u', $phone) || mb_strlen($description) > 1500) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'message' => 'Перевірте введені дані']);
    exit;
}

$message = "🔶 Нова заявка BlackMetal\n\n";
$message .= "👤 Ім’я: {$name}\n";
$message .= "📞 Телефон: {$phone}\n";
$message .= "📝 Замовлення: " . ($description !== '' ? $description : 'Без опису');

$url = 'https://api.telegram.org/bot' . rawurlencode((string)$config['bot_token']) . '/sendMessage';
$context = stream_context_create(['http' => [
    'method' => 'POST',
    'header' => "Content-Type: application/x-www-form-urlencoded\r\n",
    'content' => http_build_query([
        'chat_id' => $config['chat_id'],
        'text' => $message,
    ]),
    'timeout' => 10,
    'ignore_errors' => true,
]]);

$result = @file_get_contents($url, false, $context);
$decoded = $result ? json_decode($result, true) : null;
if (!is_array($decoded) || empty($decoded['ok'])) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'message' => 'Telegram не прийняв заявку']);
    exit;
}

echo json_encode(['ok' => true]);
