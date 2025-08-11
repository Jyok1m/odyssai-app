# Redux Store Documentation

## Structure du Store

Le store R### 4. Hook per### 5. Sélecteurs

```typescript
import { selectMessages, selectIsLoading, selectMessagesCount } from "../store";

const messages = useAppSelector(selectMessages);
const isLoading = useAppSelector(selectIsLoading);
const messageCount = useAppSelector(selectMessagesCount);
```

### 6. Reset du Store

Le reset du store peut être effectué de plusieurs façons :

#### Via le hook personnalisé (recommandé)

```typescript
const { resetChat } = useChatActions();
resetChat(); // Reset avec nouveau message de bienvenue
```

#### Via les actions Redux directement

```typescript
import { resetCompleteStore, clearMessages } from "../store";

dispatch(resetCompleteStore()); // Reset complet avec message de bienvenue
dispatch(clearMessages()); // Vider sans message de bienvenue
```

#### Via l'interface utilisateur

Un bouton de reset est disponible dans le header du chat qui ouvre une modale de confirmation avant de supprimer tous les messages. pour les actions de chat

````typescript
import { useChatActions } from '../store';

const { sendMessage, resetChat, clearAllMessages } = useChatActions();

// Envoyer un message (ajoute automatiquement + déclenche l'IA)
sendMessage("Hello!");

// Reset complet de la conversation
resetChat();

// Vider tous les messages (sans ajouter de message de bienvenue)
clearAllMessages();
```configuré avec Redux Toolkit et la persistence pour maintenir les messages de chat même après la fermeture de l'application.

### Structure des dossiers

````

store/
├── index.ts # Point d'entrée principal
├── store.ts # Configuration du store avec persistence
├── types.ts # Types TypeScript
├── hooks.ts # Hooks Redux typés
├── messagesSlice.ts # Slice pour la gestion des messages
├── asyncActions.ts # Actions asynchrones
├── selectors.ts # Sélecteurs mémorisés
└── ReduxProvider.tsx # Composant wrapper pour Redux

````

## Utilisation

### 1. Hooks Redux

```typescript
import { useAppDispatch, useAppSelector } from "../store";

const dispatch = useAppDispatch();
const messages = useAppSelector((state) => state.messages.messages);
````

### 2. Actions synchrones

```typescript
import { addMessage, clearMessages } from "../store";

// Ajouter un message
dispatch(
	addMessage({
		id: Date.now().toString(),
		text: "Hello!",
		isUser: true,
		timestamp: new Date(),
	})
);

// Vider les messages
dispatch(clearMessages());
```

### 3. Actions asynchrones

```typescript
import { sendMessageToAI, resetConversation } from "../store";

// Envoyer un message à l'IA (simulation)
dispatch(sendMessageToAI("Hello AI!"));

// Réinitialiser la conversation
dispatch(resetConversation());
```

### 4. Sélecteurs

```typescript
import { selectMessages, selectIsLoading, selectMessagesCount } from "../store";

const messages = useAppSelector(selectMessages);
const isLoading = useAppSelector(selectIsLoading);
const messageCount = useAppSelector(selectMessagesCount);
```

## Actions disponibles

### Synchrones

- `addMessage(message)` - Ajouter un message
- `setMessages(messages)` - Définir tous les messages
- `clearMessages()` - Vider tous les messages
- `updateMessage({ id, text })` - Mettre à jour un message
- `deleteMessage(id)` - Supprimer un message
- `setLoading(boolean)` - Définir l'état de chargement
- `setError(string | null)` - Définir une erreur

### Asynchrones

- `sendMessageToAI(message)` - Envoyer un message à l'IA et recevoir une réponse
- `resetConversation()` - Réinitialiser la conversation avec un message de bienvenue

## Sélecteurs disponibles

- `selectMessages` - Tous les messages
- `selectIsLoading` - État de chargement
- `selectError` - Erreur actuelle
- `selectMessagesCount` - Nombre de messages
- `selectUserMessages` - Messages de l'utilisateur uniquement
- `selectBotMessages` - Messages du bot uniquement
- `selectLastMessage` - Dernier message

## Persistence

Les messages sont automatiquement sauvegardés dans AsyncStorage et restaurés au démarrage de l'application grâce à Redux Persist.

## Configuration

Le store est configuré avec :

- Redux Toolkit pour la gestion d'état simplifiée
- Redux Persist pour la persistence avec AsyncStorage
- Middleware pour la gestion des actions non-sérialisables
- Types TypeScript stricts
