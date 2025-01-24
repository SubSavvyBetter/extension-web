// Mots-clés pour détecter les systèmes de connexion dans les URLs
const loginKeywords = [
  "login", "log-in", "signin", "sign-in", "account", "profile",
  "dashboard", "register", "signup", "sign-up", "auth", "authenticate",
  "authentication", "access", "my-account", "session", "credentials",
  "user", "logon", "log-on", "secure"
];

// Écoute des changements dans les onglets
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const currentTabUrl = tab.url.toLowerCase(); // Convertir l'URL en minuscule pour éviter les problèmes de casse

    // Vérifier si l'URL contient un mot-clé de connexion
    const hasLoginKeywordInUrl = loginKeywords.some((keyword) => currentTabUrl.includes(keyword));

    if (hasLoginKeywordInUrl) {
      console.log("Système de connexion détecté via l'URL :", currentTabUrl);

      // Vérifier si l'utilisateur est connecté en récupérant le token
      chrome.storage.local.get("token", (data) => {
        const token = data.token;
        if (!token) {
          console.log("Utilisateur non connecté. Impossible de récupérer les abonnements.");
          return; // L'utilisateur n'est pas connecté, on arrête ici
        }

        // Requête pour récupérer tous les abonnements depuis l'API
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
            // Vérifier si un abonnement correspond à l'URL
            const matchedService = subscriptions.find((sub) =>
              currentTabUrl.includes(sub.name.toLowerCase()) // Vérifie si le nom de l'abonnement est présent dans l'URL
            );

            if (!matchedService) {
              // Si aucun abonnement ne correspond, afficher une notification
              chrome.notifications.create("addSubscriptionReminder", {
                type: "basic",
                iconUrl: "logo.png", // Remplacez par le chemin vers l'icône de votre extension
                title: "Abonnement non trouvé",
                message: "N'oubliez pas d'ajouter cet abonnement à votre liste !",
                priority: 2,
              });
            } else {
              console.log(`Abonnement trouvé : ${matchedService.name}`);
            }
          })
          .catch((error) => {
            console.error("Erreur lors de la récupération des abonnements :", error);
          });
      });
    } else {
      console.log("Aucun mot-clé de connexion détecté dans l'URL :", currentTabUrl);
    }
  }
});

// Écoute des clics sur les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === "addSubscriptionReminder") {
    chrome.tabs.create({ url: "https://subsavvy.xyz" }); // Ouvre un onglet avec l'URL spécifiée
    chrome.notifications.clear(notificationId); // Efface la notification après le clic
  }
});
