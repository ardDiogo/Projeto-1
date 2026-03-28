<?php
/**
 * Emagrecentro Araguari – Roleta da Sorte
 * Recebe os dados do lead e envia e-mail + salva em CSV.
 *
 * Suba este arquivo na raiz do seu WordPress (ou numa pasta /roleta/).
 * Exemplo de acesso: https://emagrecentroaraguari.com/salvar-lead.php
 */

// ══════════════════════════════════════════
//  CONFIGURAÇÃO  ← edite aqui
// ══════════════════════════════════════════
define('OWNER_EMAIL', 'emagaraguari@gmail.com'); // seu e-mail
define('CSV_FILE',    __DIR__ . '/leads-roleta.csv');       // arquivo de backup
define('SECRET_KEY',  'emagrecentro2025');                  // chave secreta (mesma no HTML)
// ══════════════════════════════════════════

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // permite chamadas do seu próprio site
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST')    { json_err('Método inválido.'); }

// Lê corpo JSON
$body = json_decode(file_get_contents('php://input'), true);
if (!$body) { json_err('Dados inválidos.'); }

// Valida chave secreta (evita spam de bots)
if (($body['key'] ?? '') !== SECRET_KEY) { json_err('Acesso negado.'); }

// Sanitiza campos
$nome    = sanitize($body['nome']    ?? '');
$email   = sanitize($body['email']   ?? '');
$tel     = sanitize($body['tel']     ?? '');
$premio  = sanitize($body['premio']  ?? '');
$data    = date('d/m/Y H:i:s');

if (!$nome || !$email || !$tel || !$premio) { json_err('Campos obrigatórios faltando.'); }
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) { json_err('E-mail inválido.'); }

// ── Salva no CSV ──
$novo = !file_exists(CSV_FILE);
$fp   = fopen(CSV_FILE, 'a');
if ($fp) {
    if ($novo) fputcsv($fp, ['Data', 'Nome', 'E-mail', 'Telefone', 'Prêmio'], ';');
    fputcsv($fp, [$data, $nome, $email, $tel, $premio], ';');
    fclose($fp);
}

// ── Envia e-mail para o dono ──
$assunto = "🎰 Roleta da Sorte – $nome ganhou: $premio";
$msg = "
Novo lead da Roleta da Sorte!

━━━━━━━━━━━━━━━━━━━━━━━
 Nome:      $nome
 E-mail:    $email
 Telefone:  $tel
 Prêmio:    $premio
 Data/Hora: $data
━━━━━━━━━━━━━━━━━━━━━━━

Entre em contato para confirmar o prêmio.
";

$headers  = "From: Roleta Emagrecentro <noreply@emagrecentroaraguari.com.br>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

mail(OWNER_EMAIL, $assunto, $msg, $headers);

echo json_encode(['ok' => true]);

// ── Funções ──
function sanitize($v) { return htmlspecialchars(strip_tags(trim($v)), ENT_QUOTES, 'UTF-8'); }
function json_err($msg) { http_response_code(400); echo json_encode(['ok' => false, 'erro' => $msg]); exit; }
