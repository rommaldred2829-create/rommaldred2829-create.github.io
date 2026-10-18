<?php
// Contact API: accepts JSON or form POST, validates, and saves the message to api/messages.log.
// (InfinityFree blocks PHP mail(), so messages are stored instead. Download messages.log via FTP to read them.)
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'Method not allowed']);
}

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
    $input = $_POST;
}
$clean = fn($v, int $max): string => mb_substr(trim(strip_tags((string)($v ?? ''))), 0, $max);

$name    = $clean($input['name'] ?? '', 100);
$email   = $clean($input['email'] ?? '', 150);
$subject = $clean($input['subject'] ?? '', 150);
$message = $clean($input['message'] ?? '', 3000);

if (mb_strlen($name) < 2 || mb_strlen($subject) < 3 || mb_strlen($message) < 10 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(422, ['ok' => false, 'error' => 'Please fill in all fields correctly.']);
}

$entry = json_encode([
    'time'    => date('c'),
    'name'    => $name,
    'email'   => $email,
    'subject' => $subject,
    'message' => $message,
    'ip_hash' => hash('sha256', $_SERVER['REMOTE_ADDR'] ?? ''),
], JSON_UNESCAPED_UNICODE) . "\n";

if (file_put_contents(__DIR__ . '/messages.log', $entry, FILE_APPEND | LOCK_EX) === false) {
    reply(500, ['ok' => false, 'error' => 'Could not save the message.']);
}
reply(200, ['ok' => true]);
