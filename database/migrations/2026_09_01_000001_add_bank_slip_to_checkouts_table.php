<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('checkouts', function (Blueprint $table) {
            $table->string('bank_slip_path')->nullable()->after('total');
            $table->timestamp('bank_slip_verified_at')->nullable()->after('bank_slip_path');
            $table->foreignId('bank_slip_verified_by')->nullable()->after('bank_slip_verified_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('checkouts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('bank_slip_verified_by');
            $table->dropColumn(['bank_slip_path', 'bank_slip_verified_at']);
        });
    }
};
