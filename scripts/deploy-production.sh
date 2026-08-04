#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-$HOME/domains/nabobholdings.com}"
PUBLIC_HTML="${PUBLIC_HTML:-$APP_DIR/public_html}"
PHP_BIN="${PHP_BIN:-php}"
COMPOSER_BIN="${COMPOSER_BIN:-composer.phar}"

echo "==> Deploying Nabob Holdings in $APP_DIR"
cd "$APP_DIR"

# Re-exec after pull so we always run the latest script body.
if [[ "${DEPLOY_REEXECED:-}" != "1" ]]; then
    echo "==> Pull latest code"
    git pull origin main
    export DEPLOY_REEXECED=1
    exec bash "$0" "$@"
fi

echo "==> Install PHP dependencies"
if [[ -f "$COMPOSER_BIN" ]]; then
    $PHP_BIN -d memory_limit=-1 "$COMPOSER_BIN" install --no-dev --optimize-autoloader
elif command -v composer >/dev/null 2>&1; then
    composer install --no-dev --optimize-autoloader
else
    echo "Composer not found. Run: curl -sS https://getcomposer.org/installer | $PHP_BIN"
    exit 1
fi

echo "==> Run migrations"
$PHP_BIN artisan migrate --force

echo "==> Ensure single owner store (admin) and claim catalog"
$PHP_BIN artisan store:claim-owner --claim

echo "==> Release any stuck pending store funds to available"
$PHP_BIN artisan store:release-pending-funds

echo "==> Index product images for visual search"
$PHP_BIN artisan products:index-image-colors

echo "==> Storage link (safe if already exists)"
$PHP_BIN artisan storage:link 2>/dev/null || true

echo "==> Sync built assets into public_html docroot"
if [[ -d "$APP_DIR/public/build" ]]; then
    rm -rf "$PUBLIC_HTML/build"
    cp -r "$APP_DIR/public/build" "$PUBLIC_HTML/build"
fi

echo "==> Sync public_html .htaccess (HTTPS + www → apex)"
if [[ -f "$APP_DIR/public/.htaccess" ]]; then
    cp "$APP_DIR/public/.htaccess" "$PUBLIC_HTML/.htaccess"
fi

echo "==> Sync catalog categories (Sahan tree)"
$PHP_BIN artisan catalog:sync-categories --deactivate-old

echo "==> Cache for production"
$PHP_BIN artisan config:cache
$PHP_BIN artisan route:cache
$PHP_BIN artisan view:cache

echo "==> Fix permissions"
chmod -R 775 storage bootstrap/cache

echo "==> Done. Open https://nabobholdings.com"
