// Gestion du stockage et du formulaire principal

class MedicationLogger {
    constructor() {
        this.storageKey = 'adhd_med_log';
        this.form = document.getElementById('medicationForm');
        this.successMessage = document.getElementById('successMessage');
        this.dateDisplay = document.getElementById('dateDisplay');
        this.timePeriodSelect = document.getElementById('timePeriod');

        this.initializeDate();
        this.initializeForm();
        this.initializeTabs();
        this.loadFormData();
    }

    initializeDate() {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.dateDisplay.textContent = today.toLocaleDateString('fr-FR', options);
        this.todayKey = this.getDateKey(today);
    }

    getDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    initializeTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.dataset.tab;

                // Désactiver tous les onglets
                tabButtons.forEach(b => b.classList.remove('active'));
                tabContents.forEach(t => t.classList.remove('active'));

                // Activer l'onglet sélectionné
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');

                // Si on clique sur les stats, mettre à jour
                if (tabName === 'stats') {
                    this.updateStats();
                }
            });
        });
    }

    initializeForm() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.setDefaultTime();
    }

    setDefaultTime() {
        const medTimeInput = document.getElementById('medTime');
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        medTimeInput.value = `${hours}:${minutes}`;
    }

    loadFormData() {
        const data = this.getDataForToday();
        if (!data) return;

        // Remplir les champs texte
        const textFields = ['medName', 'reboundEffect', 'sleepHours', 'naps'];
        textFields.forEach(field => {
            const el = document.getElementById(field);
            if (el && data[field]) {
                el.value = data[field];
            }
        });

        // Remplir les champs time
        ['medTime', 'breakfastTime'].forEach(field => {
            const el = document.getElementById(field);
            if (el && data[field]) {
                el.value = data[field];
            }
        });

        // Remplir les radios de comportements
        Object.keys(data).forEach(key => {
            if (key.startsWith('behavior_')) {
                const radios = document.querySelectorAll(`input[name="${key}"]`);
                radios.forEach(radio => {
                    if (radio.value === String(data[key])) {
                        radio.checked = true;
                    }
                });
            }
        });

        // Remplir les radios d'effets secondaires et noms
        Object.keys(data).forEach(key => {
            if (key.startsWith('sideeffect_')) {
                if (key.includes('_name')) {
                    const el = document.querySelector(`input[name="${key}"]`);
                    if (el) el.value = data[key];
                } else {
                    const radios = document.querySelectorAll(`input[name="${key}"]`);
                    radios.forEach(radio => {
                        if (radio.value === data[key]) {
                            radio.checked = true;
                        }
                    });
                }
            }
        });
    }

    handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(this.form);
        const data = {
            date: this.todayKey,
            medName: document.getElementById('medName').value,
            medTime: document.getElementById('medTime').value,
            reboundEffect: document.getElementById('reboundEffect').value,
            breakfastTime: document.getElementById('breakfastTime').value,
            sleepHours: parseFloat(document.getElementById('sleepHours').value) || null,
            naps: document.getElementById('naps').value,
        };

        // Récupérer les comportements
        const behaviors = ['focus', 'directions', 'homework', 'time', 'anger', 'interrupt', 'hyperactivity', 'social', 'calm'];
        behaviors.forEach(behavior => {
            const checked = document.querySelector(`input[name="behavior_${behavior}"]:checked`);
            if (checked) {
                data[`behavior_${behavior}`] = parseInt(checked.value);
            }
        });

        // Comportement autre
        const otherBehaviorName = document.querySelector('input[name="behavior_other_name"]').value;
        const otherBehavior = document.querySelector('input[name="behavior_other"]:checked');
        if (otherBehaviorName && otherBehavior) {
            data.behavior_other_name = otherBehaviorName;
            data.behavior_other = parseInt(otherBehavior.value);
        }

        // Effets secondaires
        const sideEffects = ['appetite', 'stomach', 'irritability', 'anxiety', 'sleep', 'flat', 'withdrawal'];
        sideEffects.forEach(effect => {
            const checked = document.querySelector(`input[name="sideeffect_${effect}"]:checked`);
            if (checked) {
                data[`sideeffect_${effect}`] = checked.value;
            }
        });

        // Effets secondaires autres
        for (let i = 1; i <= 2; i++) {
            const nameInput = document.querySelector(`input[name="sideeffect_other${i}_name"]`);
            const checked = document.querySelector(`input[name="sideeffect_other${i}"]:checked`);
            if (nameInput.value && checked) {
                data[`sideeffect_other${i}_name`] = nameInput.value;
                data[`sideeffect_other${i}`] = checked.value;
            }
        }

        this.saveData(data);
        this.showSuccess();
    }

    saveData(data) {
        const allData = this.getAllData();
        allData[this.todayKey] = data;
        localStorage.setItem(this.storageKey, JSON.stringify(allData));
    }

    getAllData() {
        const data = localStorage.getItem(this.storageKey);
        return data ? JSON.parse(data) : {};
    }

    getDataForToday() {
        const allData = this.getAllData();
        return allData[this.todayKey] || null;
    }

    showSuccess() {
        this.successMessage.style.display = 'block';
        setTimeout(() => {
            this.successMessage.style.display = 'none';
        }, 3000);
    }

    updateStats() {
        const StatsHandler = window.StatsHandler;
        if (StatsHandler) {
            const timePeriod = this.timePeriodSelect.value;
            StatsHandler.updateAllStats(timePeriod);
        }
    }
}

// Initialiser l'app
document.addEventListener('DOMContentLoaded', () => {
    window.medicationLogger = new MedicationLogger();
});
