document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("token", (data) => {
    if (data.token) {
      showSubscriptionList();
    } else {
      showLoginForm();
    }
  });
});

function showLoginForm() {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = `
    <h3>Connexion</h3>
    <form id="login-form">
      <input type="text" id="username" placeholder="nom d'utilisateur" required />
      <input type="password" id="password" placeholder="mot de passe" required />
      <button type="submit">Se connecter</button>
    </form>
  `;

  const form = document.getElementById("login-form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch("https://api.subsavvy.xyz/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
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
          showSubscriptionList();
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la connexion :", error);
        alert("Nom d'utilisateur ou mot de passe incorrect.");
      });
  });
}

function showSubscriptionList() {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = `
    <h3>Mes abonnements</h3>
    <ul id="subscriptions-list"></ul>
    <button id="subscription-add-button">
      <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill=white fill-rule="evenodd" clip-rule="evenodd"><path d="M11.5 0c6.347 0 11.5 5.153 11.5 11.5s-5.153 11.5-11.5 11.5-11.5-5.153-11.5-11.5 5.153-11.5 11.5-11.5zm0 1c5.795 0 10.5 4.705 10.5 10.5s-4.705 10.5-10.5 10.5-10.5-4.705-10.5-10.5 4.705-10.5 10.5-10.5zm.5 10h6v1h-6v6h-1v-6h-6v-1h6v-6h1v6z"/></svg>
    </button>
  `;

  chrome.storage.local.get("token", (data) => {
    const token = data.token;

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
        list.innerHTML = "";

        subscriptions.forEach((sub) => {
          const li = document.createElement("li");
          li.style.display = "flex";
          li.style.alignItems = "center";
          li.style.justifyContent = "space-between";

          li.innerHTML = `
            <span class="subscription-name">${sub.name}</span>
            <span class="subscription-price">${sub.price} €</span>
            <button class="delete-button" data-id="${sub.id}" style="background-color: red; color: white; border: none; border-radius: 4px; padding: 5px 10px; cursor: pointer;">
              🗑️
            </button>
          `;

          list.appendChild(li);
        });

        // Attache les événements pour chaque bouton
        attachDeleteEvents();
      })
      .catch((error) => {
        console.error("Erreur lors de la récupération des abonnements :", error);
        alert("Impossible de charger vos abonnements.");
      });
  });

  document
    .getElementById("subscription-add-button")
    .addEventListener("click", showAddSubscriptionForm);
}

function attachDeleteEvents() {
  const deleteButtons = document.querySelectorAll(".delete-button");

  deleteButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const subscriptionId = event.target.getAttribute("data-id");
      deleteSubscription(subscriptionId);
    });
  });
}

function showAddSubscriptionForm() {
  const contentDiv = document.getElementById("content");
  contentDiv.innerHTML = `
    <h3>Ajouter un abonnement</h3>
    <form id="add-subscription-form">
      <input type="text" id="name" placeholder="Nom de l'abonnement" required />
      <input type="number" id="price" placeholder="Prix (€)" required />
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

    addSubscription(subscriptionData);
  });

  document
    .getElementById("cancel-button")
    .addEventListener("click", showSubscriptionList);
}

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
        showSubscriptionList();
      })
      .catch((error) => {
        console.error("Erreur lors de l'ajout de l'abonnement :", error);
        alert("Une erreur est survenue. Réessayez plus tard.");
      });
  });
}
function deleteSubscription(subscriptionId) {
  chrome.storage.local.get("token", (data) => {
    const token = data.token;

    if (!token) {
      alert("Veuillez vous reconnecter !");
      return;
    }

    fetch(`https://api.subsavvy.xyz/subscriptions/${subscriptionId}`, {
      method: "DELETE",
      headers: {
        Authorization: token,
        Accept: "*/*",
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'abonnement.");
        }
        return response.text(); // Utilisez `text()` au lieu de `json()` pour éviter des erreurs de parsing
      })
      .then(() => {
        alert("Abonnement supprimé avec succès !");
        showSubscriptionList(); // Recharge la liste après suppression
      })
      .catch((error) => {
        console.error("Erreur lors de la suppression de l'abonnement :", error);
        alert("Une erreur est survenue. Réessayez plus tard.");
      });
  });
}
