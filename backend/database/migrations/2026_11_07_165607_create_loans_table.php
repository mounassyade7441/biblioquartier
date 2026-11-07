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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('book_id')->constrained();
            $table->dateTime('borrowed_at');
            $table->dateTime('due_at');                  // date limite de retour
            $table->dateTime('returned_at')->nullable(); // NULL = emprunt en cours
            $table->boolean('extended')->default(false); // déjà prolongé ? (règle 4)
            $table->timestamps();

            $table->index(['user_id', 'returned_at']); // "emprunts en cours de cet adhérent"
            $table->index(['book_id', 'returned_at']); // "exemplaires sortis de ce livre"
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
