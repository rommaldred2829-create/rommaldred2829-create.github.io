<?php
// Copy this file to config.php and fill it in. config.php is git-ignored so your
// passwords never end up in the GitHub repository.
//
// Create the admin password hash with:
//   php -r "echo password_hash('your-strong-password', PASSWORD_DEFAULT);"
return [
    'host'       => 'localhost',          // InfinityFree: the MySQL host shown in your panel
    'name'       => 'student_records',
    'user'       => 'root',
    'pass'       => '',
    'admin_hash' => '',                   // paste the hash here; the app refuses to run while it is empty
];
