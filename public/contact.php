<?php
// WRTPros contact form handler
// Sends email to contact@wrtpros.com
// NOTE: Some hosts disable PHP mail(). If you don't receive emails, use SMTP (see README).

function clean($s) {
  return trim(preg_replace('/[\r\n]+/', ' ', $s));
}

$name    = isset($_POST['name']) ? clean($_POST['name']) : '';
$phone   = isset($_POST['phone']) ? clean($_POST['phone']) : '';
$email   = isset($_POST['email']) ? clean($_POST['email']) : '';
$service = isset($_POST['service']) ? clean($_POST['service']) : '';
$message = isset($_POST['message']) ? trim($_POST['message']) : '';

if ($name === '' || $phone === '' || $message === '') {
  http_response_code(400);
  echo "Missing required fields.";
  exit;
}

$to = "contact@wrtpros.com";
$subject = "New Website Lead — " . $service;
$body = "New lead from WRTPros.com\n\n"
  . "Name: " . $name . "\n"
  . "Phone: " . $phone . "\n"
  . "Email: " . $email . "\n"
  . "Service: " . $service . "\n\n"
  . "Message:\n" . $message . "\n\n"
  . "IP: " . $_SERVER['REMOTE_ADDR'] . "\n"
  . "User Agent: " . (isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : '') . "\n";

$headers = "From: WRTPros Website <no-reply@wrtpros.com>\r\n";
if ($email !== '') {
  $headers .= "Reply-To: " . $email . "\r\n";
}

$ok = @mail($to, $subject, $body, $headers);

if ($ok) {
  header("Location: index.html#contact");
  exit;
} else {
  http_response_code(500);
  echo "Message failed to send. If this continues, call/text (469) 759-9659.";
}
?>
