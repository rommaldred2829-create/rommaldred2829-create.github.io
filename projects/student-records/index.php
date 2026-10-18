<?php
declare(strict_types=1);
session_start();

$configFile = __DIR__ . '/config.php';
if (!is_file($configFile)) { http_response_code(500); exit('Copy config.sample.php to config.php and fill it in.'); }
$cfg = require $configFile;
if (empty($cfg['admin_hash'])) { http_response_code(500); exit('Set admin_hash in config.php first (see README.md).'); }

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'");

function e(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }
function head(string $t): void {
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' . e($t) . '</title><style>
:root{--bg:#050a07;--card:rgba(255,255,255,.05);--bd:rgba(120,255,190,.18);--tx:#e8f5ee;--mu:#9db3a8;--ac:#00ff9f}
*{box-sizing:border-box}body{margin:0;padding:24px;background:var(--bg);color:var(--tx);font:16px/1.6 "Segoe UI",system-ui,sans-serif}
main{width:min(960px,100%);margin:auto}h1{margin:0 0 16px}a{color:var(--ac)}
.card{background:var(--card);border:1px solid var(--bd);border-radius:14px;padding:20px;margin-bottom:20px}
form.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;align-items:end}
label{display:grid;gap:4px;font-size:.85rem;color:var(--mu)}
input{padding:10px 12px;border-radius:8px;border:1px solid var(--bd);background:#07110b;color:var(--tx);font:inherit}
button,.btn{padding:10px 16px;border-radius:8px;border:0;background:var(--ac);color:#03140a;font:600 1rem inherit;cursor:pointer;text-decoration:none;display:inline-block}
button.ghost{background:transparent;color:var(--tx);border:1px solid var(--bd)}button.danger{background:#f87171}
input:focus,button:focus-visible,a:focus-visible{outline:3px solid var(--ac);outline-offset:2px}
.table{overflow-x:auto}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:10px;border-bottom:1px solid var(--bd);white-space:nowrap}th{color:var(--mu);font-weight:600}
.ok{color:var(--ac)}.bad{color:#f87171}.bar{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
</style></head><body><main>';
}

// ---------- Login / logout ----------
$_SESSION['csrf'] ??= bin2hex(random_bytes(16));
$csrf = $_SESSION['csrf'];
$tokenOk = fn(): bool => hash_equals($csrf, (string)($_POST['csrf'] ?? ''));
$error = $notice = '';

if (isset($_POST['login'])) {
    if ($tokenOk() && password_verify((string)($_POST['password'] ?? ''), $cfg['admin_hash'])) {
        session_regenerate_id(true);
        $_SESSION['ok'] = true;
        header('Location: ./'); exit;
    }
    $error = 'Wrong password.';
}
if (isset($_POST['logout']) && $tokenOk()) { session_destroy(); header('Location: ./'); exit; }

if (empty($_SESSION['ok'])) {
    head('Student Records | Login');
    echo '<div class="card" style="max-width:380px;margin:80px auto"><h1>Admin login</h1>';
    if ($error) echo '<p class="bad">' . e($error) . '</p>';
    echo '<form method="post" class="grid" style="grid-template-columns:1fr"><input type="hidden" name="csrf" value="' . e($csrf) . '">
<label>Password<input type="password" name="password" autocomplete="current-password" required></label>
<button name="login" value="1">Log in</button></form></div></main></body></html>';
    exit;
}

// ---------- Database (prepared statements everywhere) ----------
try {
    $pdo = new PDO("mysql:host={$cfg['host']};dbname={$cfg['name']};charset=utf8mb4", $cfg['user'], $cfg['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException) {
    http_response_code(500); exit('Database connection failed. Check config.php.');
}

// ---------- Create / update / delete ----------
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!$tokenOk()) { http_response_code(400); exit('Invalid request token.'); }
    $action = $_POST['action'];
    $id = (int)($_POST['id'] ?? 0);
    try {
        if ($action === 'delete') {
            $pdo->prepare('DELETE FROM students WHERE id = ?')->execute([$id]);
            $notice = 'Student deleted.';
        } else {
            $f = [
                'student_no' => trim((string)($_POST['student_no'] ?? '')),
                'full_name'  => trim((string)($_POST['full_name'] ?? '')),
                'course'     => trim((string)($_POST['course'] ?? '')),
                'year_level' => (int)($_POST['year_level'] ?? 0),
                'email'      => trim((string)($_POST['email'] ?? '')),
            ];
            if (!preg_match('/^[A-Za-z0-9-]{3,20}$/', $f['student_no'])) $error = 'Student number: 3 to 20 letters, numbers or dashes.';
            elseif (mb_strlen($f['full_name']) < 2 || mb_strlen($f['full_name']) > 100) $error = 'Enter the full name.';
            elseif (mb_strlen($f['course']) < 2 || mb_strlen($f['course']) > 80) $error = 'Enter the course.';
            elseif ($f['year_level'] < 1 || $f['year_level'] > 6) $error = 'Year level must be 1 to 6.';
            elseif ($f['email'] !== '' && !filter_var($f['email'], FILTER_VALIDATE_EMAIL)) $error = 'Enter a valid email or leave it empty.';
            else {
                $vals = [$f['student_no'], $f['full_name'], $f['course'], $f['year_level'], $f['email'] ?: null];
                if ($action === 'update') {
                    $pdo->prepare('UPDATE students SET student_no=?, full_name=?, course=?, year_level=?, email=? WHERE id=?')->execute([...$vals, $id]);
                    $notice = 'Student updated.';
                } else {
                    $pdo->prepare('INSERT INTO students (student_no, full_name, course, year_level, email) VALUES (?,?,?,?,?)')->execute($vals);
                    $notice = 'Student added.';
                }
            }
        }
    } catch (PDOException $ex) {
        $error = $ex->getCode() === '23000' ? 'That student number already exists.' : 'Database error. Please try again.';
    }
}

// ---------- Read (search + optional edit) ----------
$q = trim((string)($_GET['q'] ?? ''));
$like = '%' . addcslashes($q, '%_\\') . '%';
$stmt = $pdo->prepare('SELECT * FROM students WHERE full_name LIKE :a OR student_no LIKE :b ORDER BY full_name LIMIT 100');
$stmt->execute([':a' => $like, ':b' => $like]);
$rows = $stmt->fetchAll();

$edit = null;
if (isset($_GET['edit'])) {
    $s = $pdo->prepare('SELECT * FROM students WHERE id = ?');
    $s->execute([(int)$_GET['edit']]);
    $edit = $s->fetch() ?: null;
}
$confirm = null;
if (isset($_GET['confirm'])) {
    $s = $pdo->prepare('SELECT id, full_name FROM students WHERE id = ?');
    $s->execute([(int)$_GET['confirm']]);
    $confirm = $s->fetch() ?: null;
}
$v = fn(string $k): string => e($edit[$k] ?? '');

head('Student Records');
?>
<div class="bar"><h1>Student Records</h1>
  <form method="post"><input type="hidden" name="csrf" value="<?= e($csrf) ?>"><button class="ghost" name="logout" value="1">Log out</button></form></div>
<?php if ($notice): ?><p class="ok" role="status"><?= e($notice) ?></p><?php endif; ?>
<?php if ($error): ?><p class="bad" role="alert"><?= e($error) ?></p><?php endif; ?>

<?php if ($confirm): ?>
<div class="card" role="alertdialog" aria-labelledby="cd">
  <h2 id="cd">Delete <?= e($confirm['full_name']) ?>?</h2>
  <p>This cannot be undone.</p>
  <form method="post">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>"><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$confirm['id'] ?>">
    <button class="danger">Yes, delete</button> <a class="btn" href="./">Cancel</a>
  </form>
</div>
<?php endif; ?>

<div class="card">
  <h2><?= $edit ? 'Edit student' : 'Add a student' ?></h2>
  <form method="post" class="grid">
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="action" value="<?= $edit ? 'update' : 'add' ?>">
    <?php if ($edit): ?><input type="hidden" name="id" value="<?= (int)$edit['id'] ?>"><?php endif; ?>
    <label>Student no.<input name="student_no" value="<?= $v('student_no') ?>" required maxlength="20"></label>
    <label>Full name<input name="full_name" value="<?= $v('full_name') ?>" required maxlength="100"></label>
    <label>Course<input name="course" value="<?= $v('course') ?>" required maxlength="80"></label>
    <label>Year<input name="year_level" type="number" min="1" max="6" value="<?= $v('year_level') ?>" required></label>
    <label>Email (optional)<input name="email" type="email" value="<?= $v('email') ?>" maxlength="120"></label>
    <div><button><?= $edit ? 'Save changes' : 'Add student' ?></button> <?php if ($edit): ?><a class="btn" href="./">Cancel</a><?php endif; ?></div>
  </form>
</div>

<div class="card">
  <form method="get" class="grid" style="margin-bottom:12px">
    <label>Search by name or number<input name="q" value="<?= e($q) ?>"></label>
    <div><button>Search</button></div>
  </form>
  <div class="table"><table>
    <thead><tr><th>No.</th><th>Name</th><th>Course</th><th>Year</th><th>Email</th><th></th></tr></thead>
    <tbody>
    <?php foreach ($rows as $r): ?>
      <tr>
        <td><?= e($r['student_no']) ?></td><td><?= e($r['full_name']) ?></td><td><?= e($r['course']) ?></td>
        <td><?= (int)$r['year_level'] ?></td><td><?= e($r['email']) ?></td>
        <td>
          <a href="?edit=<?= (int)$r['id'] ?>">Edit</a>
          <a href="?confirm=<?= (int)$r['id'] ?>">Delete</a>
        </td>
      </tr>
    <?php endforeach; ?>
    <?php if (!$rows): ?><tr><td colspan="6">No students found.</td></tr><?php endif; ?>
    </tbody>
  </table></div>
</div>
</main></body></html>
