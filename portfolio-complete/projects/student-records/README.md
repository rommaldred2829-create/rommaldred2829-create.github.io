# Student Records (PHP + MySQL)

A small admin app to add, search, edit and delete student records.

## Run it locally (XAMPP)
1. Copy this folder into `htdocs` and start Apache and MySQL.
2. Import `schema.sql` in phpMyAdmin.
3. Copy `config.sample.php` to `config.php` and fill in your database details.
4. Create an admin password hash and paste it into `admin_hash`:
   `php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT);"`
5. Open `http://localhost/student-records/`.

## Run it on InfinityFree
1. Create a MySQL database in the control panel, then import `schema.sql` in phpMyAdmin (skip the first two lines).
2. Upload this folder, create `config.php` there with the host, database name, user and password from the panel.

## Security notes
- Every query uses PDO prepared statements, so user input cannot change the SQL.
- Output is escaped with `htmlspecialchars` to prevent XSS.
- Changes are POST-only and protected by a CSRF token.
- Access needs the admin password (stored only as a hash); the session ID is renewed after login.
- `config.php` is listed in `.gitignore`, so passwords never reach GitHub.
- GitHub Pages cannot run PHP, so this project needs PHP hosting such as InfinityFree or XAMPP.
