# Projet Rot'INSA

## Présentation

Le but est d'offrir un jeu a boire sous forme de jeu de carte
à ceux qui veulent se rôtir et passer du bon temps en soirée.

Le projet est un fork de
 [https://github.com/kara71/RotINSA](https://github.com/kara71/RotINSA)
 fait par la promo précédente ;)


## Mode d'emploi

L'application est simple,
allez sur [le site](https://embraser01.github.io/RotINSA/),
et choisissez un jeu de carte.

Ensuite il ne reste plusqu'à suivre les instructions.


Le site est disponible en mode hors-ligne ! (Chrome et Firefox)

## Rajouter des cartes

Si jamais vous trouvez qu'il manque de cartes ou que vous avez l'inspiration,
il suffit de créer une [issue](https://github.com/Embraser01/RotINSA/issues)
et de suivre le template suivant :

-----

Titre : [Nouvelle(s) carte(s)]

Deck :
    Nom du deck (liste [ici](decks/manifest.json))


Cartes :

```
{
    "type":"question",
    "content":"Première carte de type question"
},
{
    "type": "action",
    "content": "Deuxième carte de type action",
    "skipTurn":0
}
```


----

## Format des données

### Le manifest

L'ensemble des decks sont détaillés dans le fichier [`manifest.json`](decks/manifest.json).
Le fichier ressemble à ceci :

```json
{
  "decks": [
    {
      "name":"Rôti standard",
      "description": "Pour une rôtisserie classique en famille ou entre amis",
      "difficulty": 2,
      "cover": "images/poulet.jpg",
      "questions_url": "decks/rotistandard.json"
    },
    {
      "name":"Je n'ai jamais",
      "description": "Découvrez des dossiers sur vos amis de manière très conviviale",
      "difficulty": 4,
      "cover": "images/ribery.jpg",
      "questions_url": "decks/jenaijamais.json"
    }
  ]
}
```

- `name` correspond au nom du jeu de carte
- `description` est une courte description du jeu de carte
- `difficulty`, la difficulté du jeu de carte (1-5)
- `cover`, l'image du jeu de carte, ça peut être n'importe quelle URL
- `questions_url`, lien vers le `.json` du deck


### Le deck

Les decks se trouvent dans le dossier [decks](./decks).

Les fichiers de decks ont la forme suivante :

	{
		"info":{
			"nom":"Hardcore"
		},
		"cards":[
		{
			"type":"question",
			"content":"Ceux qui ont perdu au Jeu boivent {b2-4}"
		}
		...

	}

`cards` contient la liste des cartes du deck. Chaque carte possède au minimum 2 attributs :

`type` correspond au type de la carte, c'est à dire la couleur et l'action attribué à celle-ci.
Il en existe 5 types pour le moment :

 - `spin` : Pour toutes les cartes qui implique de faire tourner quelque chose parmi les participants,
 comme donner la liste des acteurs de Game Of Thrones,
 et qui implique que celui qui n'arrive plus à trouver (ou répète un élément déjà dit) doit boire.
 - `question` : Pour toutes les cartes qui font boire
 les gens qui remplissent une condition,
 comme par exemple faire boire ceux dont l'âge est pair.
 - `action` : Pour les cartes qui font faire une action à celui qui la tire,
 que ce soit boire un nombre de coups, distribuer des coups
 ou jouer à un mini-jeu avec un autre joueur pour boire.
 - `role` : Pour les cartes qui donnent un bonus,
 malus ou pouvoir à celui qui la tire jusqu’à la fin du deck.
 Des exemples sont faire boire moins ou plus de verres,
 ou pouvoir rediriger une partie de ses verres vers une autre personne.
 - `regle` : Pour les cartes qui changent le cours de la partie jusqu'à la fin du deck.
 Cela peut inclure doubler le nombre de verres
 ou empêcher de dire un mot sous peine de boisson.

`content` : correspond au texte de la carte.
Il peut contennir des balises HTML
et des templates spéciaux dont voici la liste :

 - `{b}` (DEPRECATED, utilisez plutôt `{b3-3}` pour afficher 3 bières) :
 Place un symbole 'boisson'. Il correspond au fait que le joueur doit boire un coup.
 - `{b1-3}` : Place un nombre aléatoire de symboles 'boisson',
 choisi entre le premier nombre (ici 1) et le 2ème nombre (ici 3).
 - `{j1}` : Remplace ce template par le nom d'un joueur dont c'est le tour.
 Il peut y avoir jusqu'à 3 joueurs sur une même carte,
  en utilisant respectivement `{j1}`, `{j2}` ou `{j3}`. `{j2}` et `{j3}`
  tirent eux un joueur aléatoire parmis les autres joueurs dans la partie.
  Chaque balise aura toujours la même valeur sur la carte,
  donc on peut réutiliser `{j1}` pour afficher plusieurs fois le même nom de joueur sur la carte.
 - `{nom1|nom2|nom3}` : Choisit un terme au hasard parmi plusieurs (séparés par des `|`).

Exemple : `"content":"Les {roux|chatains|bruns|blonds|chauves} n'ont pas d'âme et boivent {b1-10}."` -> La carte choisira au hasard parmi {roux|chatains|bruns|blonds|chauves} pour la couleur de cheveux, et entre 1 et 10 coups à boire à afficher sur la carte.


`count` : Optionnel, correspond au nombre de fois que la carte apparaîtra
 dans un deck (Utile pour les cartes génériques). Exemple : `"count":3` ->
 La carte apparaîtra 3 fois dans la partie. Si non défini,
  la carte n’apparaîtra qu'une fois.

`skipTurn` : Optionnel, qui sera le prochain joueur dans la liste du tour.
1 est la valeur par défaut (utilisée si il n'y a pas le paramètre),
0 ne change pas le joueur, et 2 saute le prochain joueur.
Utile pour les cartes qui font sauter des tours ou re-piocher.
(Pratique pour la carte "Ame des cartes").
