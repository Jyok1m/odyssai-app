import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { resetStore, initializeMessages } from "../store/reducers/messagesSlice";

/**
 * Hook pour synchroniser le store avec les changements de langue
 * Réinitialise les messages par défaut quand la langue change
 */
export const useLanguageSync = () => {
	const { i18n } = useTranslation();
	const dispatch = useDispatch();

	useEffect(() => {
		// Initialise les messages au démarrage
		dispatch(initializeMessages());
	}, [dispatch]);

	useEffect(() => {
		const handleLanguageChange = () => {
			// Réinitialise le store pour mettre à jour les messages par défaut
			// avec la nouvelle langue
			dispatch(resetStore());
		};

		// Écoute les changements de langue
		i18n.on("languageChanged", handleLanguageChange);

		// Nettoyage de l'écouteur
		return () => {
			i18n.off("languageChanged", handleLanguageChange);
		};
	}, [i18n, dispatch]);
};
