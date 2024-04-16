// 192.168.43.5 charaf

//server
const express = require("express");
const bodyParser = require('body-parser');
const mysql = require("mysql");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
const connection = mysql.createConnection({
  host: "localhost",
  user: "user3",
  password: "user3@123",
  database: "niputita",
});
connection.connect((err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données :', err);
        return;
    }
    console.log('Connecté à la base de données MySQL.');
});




// operations sur stagiaires
app.get("/Stagiaires", (req, res) => {
  const query = "SELECT * FROM Stagiaires";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching stagiaires:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});

app.get("/Stagiaires/findgroupe/:id_groupe", (req, res) => {
  const { id_groupe } = req.params;
  connection.query(
    "SELECT s.* FROM Stagiaires s INNER JOIN Inscriptions i ON s.id_stagiaire = i.id_stagiaire WHERE i.id_groupe = ?",
    id_groupe,
    (error, results) => {
      if (error) {
        console.error("Erreur lors de la récupération des stagiaires par groupe :", error);
        res.status(500).json({ error: "Erreur lors de la récupération des stagiaires par groupe" });
      } else {
        res.status(200).json(results);
      }
    }
  );
});



app.post('/Stagiaires/insert-from-csv', (req, res) => {
  try {
  const data = req.body;
  const query = 'INSERT INTO Stagiaires (cef,nom_stagiaire,prenom_stagiaire,email,mot_de_passe) VALUES ?';
  connection.query(query, [data], (error, results) => {
  if (error) {
  console.error('Erreur insertion des données dans la base:', error);
  res.status(500).json({ error: 'Internal Server Error' });
  return;
  }
  res.json({ success: true });
  });
  } catch (error) {
  console.error('Erreur de gestion de requete POST:', error);
  res.status(500).json({ error: 'Internal Server Error' });
  }
  });


  app.post("/Stagiaires/insert-from-form", (req, res) => {
    const { cef, nom_stagiaire, prenom_stagiaire, email, mot_de_passe, id_groupe } = req.body;
  
    // Validation des données avec des expressions régulières
    const nameRegex = /^[a-zA-Z]+$/; // Regex pour les noms ne contenant que des lettres
    const cefRegex = /^\d{13}$/; // Regex pour le CEF ne contenant que des chiffres
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex pour une adresse email valide
    const passwordRegex = /^[^<>\/]+$/; // Regex pour le mot de passe ne contenant pas <, > ou /
  
    const nameValid = nameRegex.test(nom_stagiaire) && nameRegex.test(prenom_stagiaire);
    const cefValid = cefRegex.test(cef);
    const emailValid = emailRegex.test(email) && email.length <= 60;
    const passwordValid = passwordRegex.test(mot_de_passe);
  
    // Affichage des messages d'erreur
    if (!nameValid) {
      return res.status(400).json({ error: "Les champs Nom et Prénom ne doivent contenir que des lettres." });
    }
    if (!cefValid) {
      return res.status(400).json({ error: "Le champ CEF doit contenir 13 chiffres." });
    }
    if (!emailValid) {
      return res.status(400).json({ error: "Veuillez saisir une adresse e-mail valide (max 60 caractères)." });
    }
    if (!passwordValid) {
      return res.status(400).json({ error: "Le mot de passe ne doit pas contenir les caractères <, > ou /." });
    }
  
    // Insertion des données dans la base de données
    const query = "INSERT INTO Stagiaires (cef, nom_stagiaire, prenom_stagiaire, email, mot_de_passe) VALUES (?, ?, ?, ?, ?)";
    connection.query(query, [cef, nom_stagiaire, prenom_stagiaire, email, mot_de_passe], (error, results) => {
      if (error) {
        console.error("Erreur lors de l'ajout du stagiaire :", error);
        return res.status(500).json({ error: "Erreur serveur." });
      }
      const id_stagiaire = results.insertId;
      // Insertion de l'inscription du stagiaire au groupe sélectionné
      const inscriptionQuery = "INSERT INTO Inscriptions (id_stagiaire, id_groupe) VALUES (?, ?)";
      connection.query(inscriptionQuery, [id_stagiaire, id_groupe], (inscriptionError) => {
        if (inscriptionError) {
          console.error("Erreur lors de l'inscription du stagiaire au groupe :", inscriptionError);
          return res.status(500).json({ error: "Erreur serveur." });
        }
        return res.status(201).json({ message: "Stagiaire ajouté avec succès", id: id_stagiaire });
      });
    });
  });




app.put("/Stagiaires/:id_stagiaire", (req, res) => {
  const id_stagiaire = req.params.id_stagiaire;
  const {cef,nom_stagiaire,prenom_stagiaire,email,mot_de_passe} = req.body;
  const query = "UPDATE Stagiaires SET cef=?, nom_stagiaire=?, prenom_stagiaire=?, email=?, mot_de_passe=? WHERE id_stagiaire=?";
  connection.query(query, [cef,nom_stagiaire,prenom_stagiaire,email,mot_de_passe, id_stagiaire], (error, results) => {
    if (error) {
      console.error("Error updating stagiaire:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "Stagiaire not found" });
      return;
    }
    res.json({ message: "Stagiaire updated successfully" });
  });
});

app.delete("/Stagiaires/:id_stagiaire", (req, res) => {
  const id_stagiaire = req.params.id_stagiaire;
  const query = "DELETE FROM Stagiaires WHERE id_stagiaire=?";
  connection.query(query, [id_stagiaire], (error, results) => {
    if (error) {
      console.error("Error deleting stagiaire:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "Stagiaire not found" });
      return;
    }
    res.json({ message: "Stagiaire deleted successfully" });
  });
});





// operations sur formateurs
app.get("/Formateurs", (req, res) => {
  const query = "SELECT * FROM Formateurs";
  connection.query(query, (error, results) => {
    if (error) {
      console.error("Error fetching formateurs:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});

// Endpoint pour récupérer les formateurs par filière (groupe)
app.get("/Formateurs/filiere/:id_filiere", (req, res) => {
  const id_filiere = req.params.id_filiere;
  const query = "SELECT * FROM Formateurs WHERE id_formateur IN (SELECT id_formateur FROM enseignement WHERE id_groupe IN (SELECT id_groupe FROM Groupes WHERE id_filiere = ?))";
  connection.query(query, [id_filiere], (error, results) => {
    if (error) {
      console.error("Erreur lors de la récupération des formateurs par filière :", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    res.json(results);
  });
});


app.post('/Formateurs/insert-from-csv', (req, res) => {
  try {
  const data = req.body;
  const query = 'INSERT INTO Formateurs (cin,nom_formateur,prenom_formateur,email,mot_de_passe) VALUES ?';
  connection.query(query, [data], (error, results) => {
  if (error) {
  console.error('Erreur insertion des données dans la base:', error);
  res.status(500).json({ error: 'Internal Server Error' });
  return;
  }
  res.json({ success: true });
  });
  } catch (error) {
  console.error('Erreur de gestion de requete POST:', error);
  res.status(500).json({ error: 'Internal Server Error' });
  }
  });

  app.post("/Formateurs/insert-from-form", (req, res) => {
    const { cin, nom_formateur, prenom_formateur, email, mot_de_passe } = req.body;

    // Expressions régulières pour la validation des données
    const nameRegex = /^[a-zA-Z]+$/; // Pour les noms ne contenant que des lettres
    const cinRegex = /^[A-Z]{1,2}\d{4,}$/; // Pour le CIN conforme à la spécification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Pour une adresse email valide
    const passwordRegex = /^[^<>\/]+$/; // Pour le mot de passe ne contenant pas <, > ou /

    // Vérification de la validité des données avec les expressions régulières
    const nameValid = nameRegex.test(nom_formateur) && nameRegex.test(prenom_formateur);
    const cinValid = cinRegex.test(cin) && cin.length <= 10;
    const emailValid = emailRegex.test(email) && email.length <= 60;
    const passwordValid = passwordRegex.test(mot_de_passe);

    // Affichage des messages d'erreur si les données ne sont pas valides
    if (!nameValid) {
        return res.status(400).json({ error: "Les champs Nom et Prénom ne doivent contenir que des lettres." });
    }
    if (!cinValid) {
        return res.status(400).json({ error: "Le champ CIN doit se débuter par au moins une lettre majuscule suivie des chiffres." });
    }
    if (!emailValid) {
        return res.status(400).json({ error: "Veuillez saisir une adresse e-mail valide (max 60 caractères)." });
    }
    if (!passwordValid) {
        return res.status(400).json({ error: "Le mot de passe ne doit pas contenir les caractères <, > ou /." });
    }

    // Insertion des données dans la base de données
    const query = "INSERT INTO Formateurs (cin, nom_formateur, prenom_formateur, email, mot_de_passe) VALUES (?, ?, ?, ?, ?)";
    connection.query(query, [cin, nom_formateur, prenom_formateur, email, mot_de_passe], (error, results) => {
        if (error) {
            console.error("Erreur lors de l'ajout du formateur :", error);
            return res.status(500).json({ error: "Erreur serveur." });
        }
        return res.status(201).json({ message: "Formateur ajouté avec succès", id: results.insertId });
    });
});


app.put("/Formateurs/:id_formateur", (req, res) => {
  const id_formateur = req.params.id_formateur;
  const {cin,nom_formateur,prenom_formateur,email,mot_de_passe} = req.body;
  const query = "UPDATE Formateurs SET cin=?, nom_formateur=?, prenom_formateur=?, email=?, mot_de_passe=? WHERE id_formateur=?";
  connection.query(query, [cin,nom_formateur,prenom_formateur,email,mot_de_passe, id_formateur], (error, results) => {
    if (error) {
      console.error("Error updating formateur:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "formateur not found" });
      return;
    }
    res.json({ message: "formateur updated successfully" });
  });
});

app.delete("/Formateurs/:id_formateur", (req, res) => {
  const id_formateur = req.params.id_formateur;
  const query = "DELETE FROM Formateurs WHERE id_formateur=?";
  connection.query(query, [id_formateur], (error, results) => {
    if (error) {
      console.error("Error deleting formateur:", error);
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (results.affectedRows === 0) {
      res.status(404).json({ error: "formateur not found" });
      return;
    }
    res.json({ message: "formateur deleted successfully" });
  });
});







//operations sur filieres
// READ operation for Filieres
app.get('/Filieres', (req, res) => {
  connection.query('SELECT * FROM Filieres', (error, results) => {
    if (error) {
      console.error('Error retrieving filieres:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});



// operations sur groupes
// CREATE
app.post('/Groupes', (req, res) => {
  const { id_filiere, nom_groupe, annee } = req.body;
  const query = 'INSERT INTO Groupes (id_filiere, nom_groupe, annee) VALUES (?, ?, ?)';
  connection.query(query, [id_filiere, nom_groupe, annee], (error, results) => {
    if (error) {
      console.error('Error creating groupe:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(201).json({ message: 'Groupe created successfully', groupeId: results.insertId });
    }
  });
});






// READ all groupes
app.get('/Groupes', (req, res) => {
  const query = 'SELECT * FROM Groupes';
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Error fetching groupes:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});



//admin interface
// SEARCH operation for Groupes by filiere
// Requête GET pour rechercher les groupes par filière et année
app.get('/groupes/searchbyfiliereandyear', (req, res) => {
  const nom_filiere = req.query.nom_filiere;
  const annee = req.query.annee; // Récupérer l'année depuis la requête

  // Rechercher l'id_filiere correspondant au nom_filiere fourni
  connection.query('SELECT id_filiere FROM Filieres WHERE nom_filiere = ?', [nom_filiere], (error, results) => {
    if (error) {
      console.error('Error retrieving id_filiere for filiere:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length === 0) {
      res.status(404).json({ error: 'Filiere not found' });
      return;
    }

    const id_filiere = results[0].id_filiere;

    // Exécuter la recherche des groupes avec l'id_filiere et l'année récupérés
    const query = 'SELECT * FROM Groupes WHERE id_filiere = ? AND annee = ?';
    connection.query(query, [id_filiere, annee], (error, results) => {
      if (error) {
        console.error('Error searching groupes by filiere and year:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(200).json(results);
      }
    });
  });
});




app.get('/groupes/search_for_formateur', (req, res) => {
  const id_formateur = req.query.id_formateur;
  const nom_filiere = req.query.nom_filiere;
  const annee = req.query.annee; // Ajout du paramètre année

  let query = 'SELECT DISTINCT g.* FROM Formateurs f ';
  query += 'INNER JOIN enseignement e ON f.id_formateur = e.id_formateur ';
  query += 'INNER JOIN Groupes g ON e.id_groupe = g.id_groupe ';
  query += 'INNER JOIN Filieres fl ON g.id_filiere = fl.id_filiere ';
  query += 'WHERE f.id_formateur = ?';

  // Ajouter la condition pour la filière si elle est fournie
  const params = [id_formateur];
  if (nom_filiere) {
    query += ' AND fl.nom_filiere = ?';
    params.push(nom_filiere);
  }

  // Ajouter la condition pour l'année si elle est fournie
  if (annee) {
    query += ' AND g.annee = ?';
    params.push(annee);
  }

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Erreur lors de la recherche des groupes par id_formateur, nom_filiere et annee :', error);
      res.status(500).json({ error: 'Erreur Interne du Serveur' });
    } else {
      res.status(200).json(results);
    }
  });
});






// operations sur modules
// READ operation for Modules
app.get('/Modules', (req, res) => {
  connection.query('SELECT * FROM Modules', (error, results) => {
    if (error) {
      console.error('Error retrieving modules:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});


// // module pour interface stagiaire
app.get('/modules/search_st', (req, res) => {
  const id_stagiaire = req.query.id_stagiaire;
  const id_filiere = req.query.id_filiere;
  const id_groupe = req.query.id_groupe;

  let query = 'SELECT DISTINCT m.* FROM Modules m ';
  query += 'INNER JOIN Filieres f ON m.id_filiere = f.id_filiere ';
  query += 'INNER JOIN Groupes g ON m.id_filiere = g.id_filiere ';
  query += 'INNER JOIN Inscriptions i ON g.id_groupe = i.id_groupe ';
  query += 'WHERE i.id_stagiaire = ?';
  const params = [id_stagiaire];
  // Add condition for filiere and groupe if provided
  if (id_filiere && id_groupe) {
    query += ' AND m.id_filiere = ? AND g.id_groupe = ?';
    params.push(id_filiere, id_groupe);
  }
  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Error searching modules for stagiaire:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});





// module pour interface formateur

app.get('/modules/search_fo', (req, res) => {
  const id_formateur = req.query.id_formateur;
  const nom_filiere = req.query.nom_filiere;

  let query = 'SELECT DISTINCT m.* FROM Modules m ';
  query += 'INNER JOIN enseignement e ON m.id_module = e.id_module ';
  query += 'INNER JOIN Formateurs f ON e.id_formateur = f.id_formateur ';
  query += 'INNER JOIN Filieres fl ON m.id_filiere = fl.id_filiere ';
  query += 'WHERE e.id_formateur = ?';
  
  // Add condition for filiere if provided
  const params = [id_formateur];
  if (nom_filiere) {
    query += ' AND fl.nom_filiere = ?';
    params.push(nom_filiere);
  }

  connection.query(query, params, (error, results) => {
    if (error) {
      console.error('Error searching modules by id_formateur and nom_filiere:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});


//modules pour interface admin

// SEARCH operation for Modules by filiere
app.get('/modules/searchbyfil', (req, res) => {
  const nom_filiere = req.query.nom_filiere; // Récupérer le nom de la filiere depuis la requête

  // Rechercher l'id_filiere correspondant au nom_filiere fourni
  connection.query('SELECT id_filiere FROM Filieres WHERE nom_filiere = ?', [nom_filiere], (error, results) => {
    if (error) {
      console.error('Error retrieving id_filiere for filiere:', error);
      res.status(500).json({ error: 'Internal Server Error' });
      return;
    }

    if (results.length === 0) {
      // Si aucune filiere correspondante n'est trouvée, retourner un message d'erreur
      res.status(404).json({ error: 'Filiere not found' });
      return;
    }

    const id_filiere = results[0].id_filiere; // Récupérer l'id_filiere correspondant

    // Exécuter la recherche des modules avec l'id_filiere récupéré
    const query = 'SELECT * FROM Modules WHERE id_filiere = ?';
    connection.query(query, [id_filiere], (error, results) => {
      if (error) {
        console.error('Error searching modules by filiere:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      } else {
        res.status(200).json(results);
      }
    });
  });
});

app.get('/absentCount', (req, res) => {
  const { groupe, annee } = req.query;
  const query = `SELECT COUNT(*) AS absentCount 
                 FROM Absences 
                 INNER JOIN Seances ON Absences.id_seance = Seances.id_seance
                 INNER JOIN Groupes ON Seances.id_groupe = Groupes.id_groupe
                 WHERE Groupes.nom_groupe = ? AND YEAR(Seances.date_seance) = ?`;

  connection.query(query, [groupe, annee], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    } else {
      const absentCount = results[0].absentCount;
      res.json({ absentCount });
      
    }
  });
});




app.get('/absencesByMonth', (req, res) => {
  const { selectedGroupe, selectedYear } = req.query;
  
  // Query to count absences for each month of the selected year
  const query = `
    SELECT 
      MONTH(date_seance) AS month,
      COUNT(*) AS absenceCount
    FROM Absences
    INNER JOIN Seances ON Absences.id_seance = Seances.id_seance
    INNER JOIN Groupes ON Seances.id_groupe = Groupes.id_groupe
    WHERE Groupes.nom_groupe = ? AND YEAR(Seances.date_seance) = ?
    GROUP BY MONTH(date_seance)
  `;
  
  connection.query(query, [selectedGroupe, selectedYear], (err, results) => {
    if (err) {
      console.error('Error fetching absences by month:', err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json({ absencesByMonth: results });
      
    }
  });
});


// app.get('/absentCountTotal', (req, res) => {
//   const query = 'SELECT COUNT(*) AS totalAbsentCount FROM Absences';
//   connection.query(query, (err, results) => {
//     if (err) {
//       console.error(err);
//       res.status(500).json({ error: 'Erreur interne du serveur' });
//     } else {
//       const totalAbsentCount = results[0].totalAbsentCount;
//       res.json({ totalAbsentCount });
//     }
//   });
// });


//interface admin: 
// Endpoint pour récupérer les séances en fonction de la date et de l'heure sélectionnées
app.get('/seances', (req, res) => {
  const { date, time } = req.query;

  // Convertir la date en format SQL (YYYY-MM-DD)
  const formattedDate = new Date(date).toISOString().split('T')[0];

  // Convertir le temps en format SQL (HH:MM:SS)
  const formattedTime = time + ':00';

  // Requête pour récupérer les séances correspondantes
  const query = `
    SELECT s.*, m.titre_module, g.nom_groupe
    FROM Seances s
    INNER JOIN Modules m ON s.id_module = m.id_module
    INNER JOIN Groupes g ON s.id_groupe = g.id_groupe
    WHERE s.date_seance = ? AND s.heure_debut = ?
  `;
  
  connection.query(query, [formattedDate, formattedTime], (error, results) => {
    if (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

//interface formateur 
app.get('/seances/formateur', (req, res) => {
  const { date, time, id_formateur } = req.query;

  // Convertir la date en format SQL (YYYY-MM-DD)
  const formattedDate = new Date(date).toISOString().split('T')[0];

  // Requête pour récupérer les séances correspondantes
  const query = `
    SELECT s.*, m.titre_module, g.nom_groupe
    FROM Seances s
    INNER JOIN Modules m ON s.id_module = m.id_module
    INNER JOIN Groupes g ON s.id_groupe = g.id_groupe
    INNER JOIN enseignement e ON s.id_module = e.id_module AND s.id_groupe = e.id_groupe
    WHERE s.date_seance = ? AND s.heure_debut = ? AND e.id_formateur = ?
  `;
  
  connection.query(query, [formattedDate, time, id_formateur], (error, results) => {
    if (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

//interface stagiaire
app.get('/seances-stagiaires', (req, res) => {
  const { id_stagiaire, date, time } = req.query;

  // Convertir la date en format SQL (YYYY-MM-DD)
  const formattedDate = new Date(date).toISOString().split('T')[0];

  // Requête pour récupérer les séances correspondantes
  const query = `
    SELECT s.*, m.titre_module, g.nom_groupe
    FROM Seances s
    INNER JOIN Modules m ON s.id_module = m.id_module
    INNER JOIN Groupes g ON s.id_groupe = g.id_groupe
    INNER JOIN Inscriptions i ON s.id_groupe = i.id_groupe
    WHERE i.id_stagiaire = ? AND s.date_seance = ? AND s.heure_debut = ?
  `;
  
  connection.query(query, [id_stagiaire, formattedDate, time], (error, results) => {
    if (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    } else {
      res.status(200).json(results);
    }
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
