document.addEventListener("DOMContentLoaded", () => {
    // Vérifie si l'utilisateur est connecté en cherchant le token
    chrome.storage.local.get("token", (data) => {
      if (data.token) {
        // Si l'utilisateur est connecté, affiche le formulaire d'ajout d'abonnement
        showAddSubscriptionForm();
      } else {
        // Si l'utilisateur n'est pas connecté, affiche le formulaire de connexion
        showLoginForm();
      }
    });
  });
  
  // Fonction pour afficher le formulaire de connexion
  function showLoginForm() {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `
      <form id="login-form">
        <label>Nom d'utilisateur :
          <input type="text" id="username" required />
        </label>
        <label>Mot de passe :
          <input type="password" id="password" required />
        </label>
        <button type="submit">Se connecter</button>
      </form>
    `;
  
    // Gestion du formulaire de connexion
    const form = document.getElementById("login-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
  
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;
  
      // Envoie des informations de connexion pour obtenir le token
      fetch("https://api.subsavvy.xyz/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "accept": "*/*",
        },
        body: JSON.stringify({
          username: username,
          password: password
        }),
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          // Si le token est renvoyé, le stocker dans chrome.storage
          chrome.storage.local.set({ token: data.token }, () => {
            alert("Connexion réussie !");
            window.close(); // Ferme la pop-up après la connexion réussie
          });
        } else {
          alert("Échec de la connexion");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la connexion :", error);
        alert("Erreur de connexion");
      });
    });
  }
  
  // Fonction pour afficher le formulaire d'ajout d'abonnement
  function showAddSubscriptionForm() {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `
      <form id="add-subscription-form">
        <label>Nom de l'abonnement :
          <input type="text" id="name" required />
        </label>
        <label>Prix (€) :
          <input type="number" id="price" required />
        </label>
        <label>Période d'essai :
          <input type="checkbox" id="trial" />
        </label>
        <label>Date de début :
          <input type="date" id="start_date" required />
        </label>
        <label>Date de fin :
          <input type="date" id="end_date" required />
        </label>
        <button type="submit">Ajouter l'abonnement</button>
      </form>
    `;
  
    // Gestion du formulaire d'ajout d'abonnement
    const form = document.getElementById("add-subscription-form");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
  
      const subscriptionData = {
        name: document.getElementById("name").value,
        price: parseFloat(document.getElementById("price").value),
        trial: document.getElementById("trial").checked,
        status: "ACTIVE",
        start_date: new Date(document.getElementById("start_date").value).toISOString(),
        end_date: new Date(document.getElementById("end_date").value).toISOString(),
      };
  
      // Appeler la fonction d'ajout d'abonnement avec les données du formulaire
      addSubscription(subscriptionData);
    });
  }
  
  // Fonction pour ajouter un abonnement avec le token
  function addSubscription(subscriptionData) {
    // Récupère le token stocké dans chrome.storage
    chrome.storage.local.get("token", (data) => {
      const token = data.token;
      if (!token) {
        alert("Veuillez d'abord vous connecter !");
        return;
      }
  
      // Envoie de la requête pour ajouter un abonnement avec le token dans l'en-tête
      fetch("https://api.subsavvy.xyz/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,  // Ajoute le token au header
          "accept": "*/*"
        },
        body: JSON.stringify(subscriptionData),
      })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          alert("Abonnement ajouté avec succès !");
        } else {
          alert("Erreur lors de l'ajout de l'abonnement");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de l'ajout de l'abonnement :", error);
        alert("Erreur de connexion");
      });
    });
  }
  