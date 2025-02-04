// mots-clés pour détecter les systèmes de connexion dans les URLs
const loginKeywords = [
  "login", "log-in", "signin", "sign-in", "account", "profile",
  "dashboard", "register", "signup", "sign-up", "auth", "authenticate",
  "authentication", "access", "my-account", "session", "credentials",
  "user", "logon", "log-on", "secure"
];

// fct pour extraire le domaine principal d'une URL
function getDomain(url) {
  try {
    let hostname = new URL(url).hostname;
    let domainParts = hostname.split(".");
    if (domainParts.length > 2) {
      return domainParts.slice(-2).join("."); // Récupère uniquement "amazon.fr" ou "netflix.com"
    }
    return hostname;
  } catch (error) {
    console.error("Erreur lors de l'extraction du domaine :", error);
    return null;
  }
}

// ecoute des changements dans les onglets
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    const currentTabUrl = tab.url.toLowerCase();
    const domain = getDomain(currentTabUrl);

    if (!domain) return;

    // verifie si le site est dans la liste des exclusions
    chrome.storage.local.get("excludedSites", (data) => {
      let excludedSites = data.excludedSites || [];
      if (excludedSites.includes(domain)) {
        console.log("Le site est exclu des notifications :", domain);
        return;
      }

      // verifie si l'URL contient un mot-clé de connexion
      const hasLoginKeywordInUrl = loginKeywords.some((keyword) => currentTabUrl.includes(keyword));

      if (hasLoginKeywordInUrl) {
        console.log("Système de connexion détecté via l'URL :", currentTabUrl);

        // verifie si l'utilisateur est connecté en récupérant le token
        chrome.storage.local.get("token", (data) => {
          const token = data.token;
          if (!token) {
            console.log("Utilisateur non connecté. Impossible de récupérer les abonnements.");
            return;
          }

          // request pour récupérer tous les abonnements depuis l'API
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
              // verifie si un abonnement correspond à l'URL
              const matchedService = subscriptions.find((sub) =>
                currentTabUrl.includes(sub.name.toLowerCase())
              );

              if (!matchedService) {
                // affiche une notification avec un bouton pour exclure le site
                chrome.notifications.create("addSubscriptionReminder", {
                  type: "basic",
                  iconUrl: "logo.png",
                  title: "Abonnement non trouvé",
                  message: "N'oubliez pas d'ajouter cet abonnement à votre liste !",
                  priority: 2,
                  buttons: [{ title: "Ne plus notifier ce site" }]
                });

                // stocke le domaine pour la gestion des exclusions
                chrome.storage.local.set({ lastNotificationDomain: domain });
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
    });
  }
});

// ecoute des clics sur les notifications
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === "addSubscriptionReminder") {
    chrome.tabs.create({ url: "https://subsavvy.xyz" });
    chrome.notifications.clear(notificationId);
  }
});

// ecoute des clics sur les boutons des notifications
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (notificationId === "addSubscriptionReminder" && buttonIndex === 0) {
    chrome.storage.local.get(["excludedSites", "lastNotificationDomain"], (data) => {
      let excludedSites = data.excludedSites || [];
      if (data.lastNotificationDomain && !excludedSites.includes(data.lastNotificationDomain)) {
        excludedSites.push(data.lastNotificationDomain);
        chrome.storage.local.set({ excludedSites });
        console.log("Site ajouté à la liste des exclusions :", data.lastNotificationDomain);
      }
    });

    chrome.notifications.clear(notificationId);
  }
});
