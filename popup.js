document.addEventListener("DOMContentLoaded", () => {
    // Vérifie si l'utilisateur est connecté en cherchant le token
    chrome.storage.local.get("token", (data) => {
      if (data.token) {
        showSubscriptionList(); // Affiche la liste des abonnements
      } else {
        showLoginForm(); // Affiche le formulaire de connexion
      }
    });
  });
  
  // Fonction pour afficher le formulaire de connexion
  function showLoginForm() {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `
      <h3>Connexion</h3>
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
          accept: "*/*",
        },
        body: JSON.stringify({ username, password }),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Connexion échouée !");
          }
          return response.json();
        })
        .then((data) => {
          chrome.storage.local.set({ token: data.token }, () => {
            alert("Connexion réussie !");
            showSubscriptionList(); // Affiche la liste des abonnements
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la connexion :", error);
          alert("Nom d'utilisateur ou mot de passe incorrect.");
        });
    });
  }
  
  // Fonction pour afficher la liste des abonnements
  function showSubscriptionList() {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `
      <h3>Mes abonnements</h3>
      <ul id="subscriptions-list"></ul>
      <button id="add-subscription-button">Ajouter un abonnement</button>
    `;
  
    // Récupère le token
    chrome.storage.local.get("token", (data) => {
      const token = data.token;
  
      // Requête pour récupérer les abonnements
      fetch("https://api.subsavvy.xyz/subscriptions", {
        method: "GET",
        headers: {
          Authorization: token,
          Accept: "*/*",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur lors de la récupération des abonnements.");
          }
          return response.json();
        })
        .then((subscriptions) => {
          const list = document.getElementById("subscriptions-list");
          list.innerHTML = ""; // Vide la liste avant d'ajouter les abonnements
  
          subscriptions.forEach((sub) => {
            const li = document.createElement("li");
            li.textContent = `${sub.name} - ${sub.price} €`;
            list.appendChild(li);
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la récupération des abonnements :", error);
          alert("Impossible de charger vos abonnements.");
        });
    });
  
    // Gestion du bouton "Ajouter un abonnement"
    document
      .getElementById("add-subscription-button")
      .addEventListener("click", showAddSubscriptionForm);
  }
  
  // Fonction pour afficher le formulaire d'ajout d'abonnement
  function showAddSubscriptionForm() {
    const contentDiv = document.getElementById("content");
    contentDiv.innerHTML = `
      <h3>Ajouter un abonnement</h3>
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
        <button type="submit">Ajouter</button>
        <button type="button" id="cancel-button">Annuler</button>
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
  
      // Envoie les données pour ajouter un abonnement
      addSubscription(subscriptionData);
    });
  
    // Gestion du bouton "Annuler"
    document
      .getElementById("cancel-button")
      .addEventListener("click", showSubscriptionList);
  }
  
  // Fonction pour ajouter un abonnement avec le token
  function addSubscription(subscriptionData) {
    chrome.storage.local.get("token", (data) => {
      const token = data.token;
  
      if (!token) {
        alert("Veuillez vous reconnecter !");
        return;
      }
  
      fetch("https://api.subsavvy.xyz/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          Accept: "*/*",
        },
        body: JSON.stringify(subscriptionData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Erreur lors de l'ajout de l'abonnement.");
          }
          return response.json();
        })
        .then(() => {
          alert("Abonnement ajouté avec succès !");
          showSubscriptionList(); // Recharge la liste après ajout
        })
        .catch((error) => {
          console.error("Erreur lors de l'ajout de l'abonnement :", error);
          alert("Une erreur est survenue. Réessayez plus tard.");
        });
    });
  }
  