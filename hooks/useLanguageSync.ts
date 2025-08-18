import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { resetStore, initializeMessages } from "../store/reducers/messagesSlice";
import type { RootState } from "../store/store";

/**
 * Hook pour synchroniser le store avec les changements de langue
 * Réinitialise les messages par défaut quand la langue change
 */
export const useLanguageSync = () => {
	const { i18n } = useTranslation();
	const dispatch = useDispatch();
	const messages = useSelector((state: RootState) => state.messages.messages);
	const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);

	useEffect(() => {
		// Initialise les messages au démarrage seulement si pas authentifié
		// et si aucun message n'existe
		if (!isAuthenticated && messages.length === 0) {
			dispatch(initializeMessages());
		}
	}, [dispatch, isAuthenticated, messages.length]);

	useEffect(() => {
		const handleLanguageChange = (lng: string) => {
			console.log("Language changed to:", lng, "isAuthenticated:", isAuthenticated, "messages.length:", messages.length);

			// Réinitialise le store pour mettre à jour les messages par défaut
			// avec la nouvelle langue SEULEMENT si l'utilisateur n'est pas authentifié
			// ou s'il n'y a que les messages par défaut
			if (!isAuthenticated || messages.length <= 2) {
				console.log("Resetting store due to language change");
				dispatch(resetStore());
			} else {
				console.log("Skipping store reset - user authenticated with messages");
			}
		};

		// Écoute les changements de langue
		i18n.on("languageChanged", handleLanguageChange);

		// Nettoyage de l'écouteur
		return () => {
			i18n.off("languageChanged", handleLanguageChange);
		};
	}, [i18n, dispatch, isAuthenticated, messages.length]);
};
