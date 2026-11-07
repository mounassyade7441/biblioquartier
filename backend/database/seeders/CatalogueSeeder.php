<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CatalogueSeeder extends Seeder
{
    public function run(): void
    {
        // Crée les catégories et les range dans un tableau ['Roman' => Category, ...]
        $categories = collect([
            'Roman', 'Policier', 'Science-fiction', 'Fantasy', 'BD', 'Jeunesse', 'Documentaire', 'Poésie',
        ])->mapWithKeys(fn (string $name) => [
            $name => Category::create(['name' => $name, 'slug' => Str::slug($name)]),
        ]);

        foreach ($this->books() as [$title, $author, $year, $category, $copies, $summary]) {
            Book::create([
                'title' => $title,
                'author' => $author,
                'published_year' => $year,
                'category_id' => $categories[$category]->id,
                'total_copies' => $copies,
                'summary' => $summary,
            ]);
        }
    }

    /** [titre, auteur, année, catégorie, nb d'exemplaires, résumé] */
    private function books(): array
    {
        return [
            ["L'Étranger", 'Albert Camus', 1942, 'Roman', 2, "À Alger, Meursault, un employé de bureau indifférent à tout, tue un homme sur une plage écrasée de soleil. Son procès devient celui de son étrangeté au monde."],
            ['Les Misérables', 'Victor Hugo', 1862, 'Roman', 2, "Ancien forçat traqué par l'inspecteur Javert, Jean Valjean tente de se racheter et veille sur la jeune Cosette, jusqu'aux barricades parisiennes de 1832."],
            ['Madame Bovary', 'Gustave Flaubert', 1857, 'Roman', 1, "Mariée à un médecin de campagne sans éclat, Emma Bovary rêve d'une vie romanesque et s'enfonce dans les illusions, les amants et les dettes."],
            ['Le Comte de Monte-Cristo', 'Alexandre Dumas', 1844, 'Roman', 2, "Trahi le jour de ses fiançailles et emprisonné au château d'If, Edmond Dantès s'évade, découvre un trésor et revient se venger sous une nouvelle identité."],
            ['Germinal', 'Émile Zola', 1885, 'Roman', 1, "Dans le Nord minier, Étienne Lantier découvre la misère des mineurs de Montsou et prend la tête d'une grève qui va tout bouleverser."],
            ["L'Élégance du hérisson", 'Muriel Barbery', 2006, 'Roman', 2, "Dans un immeuble bourgeois parisien, Renée, la concierge, cache sa grande culture, et Paloma, 12 ans, se cache du monde des adultes. Un nouveau voisin va les réunir."],
            ['Chanson douce', 'Leïla Slimani', 2016, 'Roman', 1, "Myriam et Paul engagent Louise, une nourrice parfaite, pour garder leurs enfants. Peu à peu, la dépendance mutuelle tourne au drame. Prix Goncourt 2016."],
            ['Ils étaient dix', 'Agatha Christie', 1939, 'Policier', 2, "Dix personnes que tout sépare sont invitées sur une île isolée. Une à une, elles meurent, au rythme des couplets d'une vieille comptine."],
            ['Le Chien des Baskerville', 'Arthur Conan Doyle', 1902, 'Policier', 1, "Une malédiction pèse sur la famille Baskerville : un chien monstrueux hanterait la lande. Sherlock Holmes et le docteur Watson mènent l'enquête."],
            ['Pars vite et reviens tard', 'Fred Vargas', 2001, 'Policier', 1, "À Paris, d'étranges 4 inversés apparaissent sur des portes, tandis que la peur de la peste se répand. Le commissaire Adamsberg enquête."],
            ["La Vérité sur l'affaire Harry Quebert", 'Joël Dicker', 2012, 'Policier', 2, "Le jeune écrivain Marcus Goldman enquête pour innocenter son mentor, Harry Quebert, accusé du meurtre d'une adolescente disparue trente ans plus tôt."],
            ['Dune', 'Frank Herbert', 1965, 'Science-fiction', 1, "Sur Arrakis, planète désertique et unique source de l'Épice, le jeune Paul Atréides voit sa famille trahie et trouve refuge auprès du peuple Fremen."],
            ['1984', 'George Orwell', 1949, 'Science-fiction', 2, "Dans un État totalitaire où Big Brother surveille chacun, Winston Smith, employé du ministère de la Vérité, ose douter et aimer."],
            ['Fahrenheit 451', 'Ray Bradbury', 1953, 'Science-fiction', 1, "Dans une société où les livres sont interdits, Montag est pompier : son métier est de les brûler. Jusqu'au jour où il commence à les lire."],
            ['La Planète des singes', 'Pierre Boulle', 1963, 'Science-fiction', 1, "Des voyageurs de l'espace atterrissent sur une planète où les singes sont civilisés et les humains réduits à l'état d'animaux."],
            ['Le Hobbit', 'J. R. R. Tolkien', 1937, 'Fantasy', 2, "Bilbo Sacquet, un hobbit casanier, est entraîné par le magicien Gandalf et treize nains dans une quête pour reprendre un trésor gardé par le dragon Smaug."],
            ["Les Fiancés de l'hiver", 'Christelle Dabos', 2013, 'Fantasy', 1, "Ophélie, qui sait traverser les miroirs et lire le passé des objets, est fiancée de force à Thorn et doit quitter son arche pour la mystérieuse Citacielle."],
            ['Astérix le Gaulois', 'René Goscinny et Albert Uderzo', 1961, 'BD', 2, "En 50 avant J.-C., un petit village d'irréductibles Gaulois résiste encore et toujours à l'envahisseur romain grâce à une potion magique."],
            ['Le Lotus bleu', 'Hergé', 1936, 'BD', 1, "Tintin part en Chine sur la piste d'un trafic d'opium et se lie d'amitié avec le jeune Tchang, dans un Shanghai sous tension."],
            ['Persepolis', 'Marjane Satrapi', 2000, 'BD', 1, "Marjane Satrapi raconte son enfance à Téhéran pendant la révolution islamique et la guerre Iran-Irak, avec humour et en noir et blanc."],
            ["L'Arabe du futur", 'Riad Sattouf', 2014, 'BD', 1, "Riad Sattouf raconte son enfance entre la Libye de Kadhafi, la France et la Syrie d'Hafez el-Assad, à travers le regard d'un petit garçon."],
            ['Blacksad : Quelque part entre les ombres', 'Juan Díaz Canales et Juanjo Guarnido', 2000, 'BD', 1, "Dans une Amérique des années 50 peuplée d'animaux, le détective privé John Blacksad enquête sur le meurtre d'une actrice qu'il a aimée."],
            ['Le Petit Prince', 'Antoine de Saint-Exupéry', 1943, 'Jeunesse', 3, "Un aviateur en panne dans le désert rencontre un petit prince venu d'une autre planète, qui lui raconte son voyage et sa rose."],
            ["Harry Potter à l'école des sorciers", 'J. K. Rowling', 1997, 'Jeunesse', 3, "Le jour de ses onze ans, Harry apprend qu'il est un sorcier et entre à Poudlard, où l'attendent amitiés, mystères et un terrible ennemi."],
            ['Le Petit Nicolas', 'René Goscinny et Jean-Jacques Sempé', 1959, 'Jeunesse', 2, "Les aventures drôles et tendres de Nicolas et de ses copains, à l'école, à la maison et dans le terrain vague."],
            ['Matilda', 'Roald Dahl', 1988, 'Jeunesse', 1, "Matilda, petite fille surdouée et passionnée de lecture, tient tête à ses parents odieux et à la terrible directrice, Mlle Legourdin."],
            ["Sapiens : Une brève histoire de l'humanité", 'Yuval Noah Harari', 2015, 'Documentaire', 2, "Comment Homo sapiens, un animal sans importance, est-il devenu le maître de la planète ? Un panorama de 70 000 ans d'histoire humaine."],
            ['Une brève histoire du temps', 'Stephen Hawking', 1988, 'Documentaire', 1, "Du Big Bang aux trous noirs, Stephen Hawking explique les grandes questions de la cosmologie à la portée de tous."],
            ['Les Fleurs du mal', 'Charles Baudelaire', 1857, 'Poésie', 1, "Le recueil majeur de Baudelaire, entre spleen et idéal, qui cherche la beauté jusque dans la laideur et la mélancolie de la ville moderne."],
            ['Alcools', 'Guillaume Apollinaire', 1913, 'Poésie', 1, "Un recueil sans ponctuation qui mêle tradition et modernité, de « Zone » au « Pont Mirabeau »."],
        ];
    }
}
