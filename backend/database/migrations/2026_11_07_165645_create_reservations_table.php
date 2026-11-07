<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
        public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('book_id')->constrained();
            $table->enum('status', ['en_attente', 'disponible', 'honoree', 'annulee', 'expiree'])
                  ->default('en_attente');
            $table->dateTime('available_at')->nullable(); // quand le livre a été mis de côté
            $table->dateTime('expires_at')->nullable();   // available_at + 3 jours (règle 6)
            $table->timestamps(); // created_at = ordre d'arrivée dans la file (règle 5)

            $table->index(['book_id', 'status', 'created_at']);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
