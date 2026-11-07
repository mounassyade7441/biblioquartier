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
        Schema::create('books', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('author');
            $table->string('isbn', 20)->nullable()->index();
            $table->text('summary')->nullable();
            $table->string('cover_url')->nullable();
            $table->unsignedSmallInteger('published_year')->nullable();
            $table->unsignedInteger('total_copies')->default(1); // nb d'exemplaires physiques
            $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->softDeletes(); // ajoute deleted_at : "retirer" un livre sans effacer l'historique

            $table->index('title');   // accélère la recherche par titre
            $table->index('author');  // accélère la recherche par auteur
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('books');
    }
};
