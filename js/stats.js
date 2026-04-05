// Gestion des statistiques et graphiques

class StatsHandler {
    static storageKey = 'adhd_med_log';

    static getAllData() {
        const data = localStorage.getItem(StatsHandler.storageKey);
        return data ? JSON.parse(data) : {};
    }

    static getSortedDates(days = 30) {
        const allData = StatsHandler.getAllData();
        const dates = Object.keys(allData).sort();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return dates.filter(date => new Date(date) >= cutoff);
    }

    static getLastDays(days = 7) {
        const dates = StatsHandler.getSortedDates(days);
        const allData = StatsHandler.getAllData();
        return dates.map(date => ({
            date,
            data: allData[date]
        }));
    }

    static getLastMonths(months = 1) {
        const dates = StatsHandler.getSortedDates(30 * months);
        const allData = StatsHandler.getAllData();
        return dates.map(date => ({
            date,
            data: allData[date]
        }));
    }

    static updateAllStats(timePeriod = 'week') {
        const dataPoints = timePeriod === 'week' ? StatsHandler.getLastDays(7) : StatsHandler.getLastMonths(1);

        StatsHandler.updateBehaviorTrendChart(dataPoints);
        StatsHandler.updateMedicationDuration();
        StatsHandler.updateCorrelations(dataPoints);
        StatsHandler.updateSideEffectsSummary(dataPoints);
    }

    static updateBehaviorTrendChart(dataPoints) {
        const behaviors = {
            focus: 'Rester focalisé',
            directions: 'Suivre les directions',
            homework: 'Compléter les devoirs',
            time: 'Gestion du temps',
            anger: 'Être moins en colère',
            interrupt: 'Interrompre moins',
            hyperactivity: 'Réduire l\'hyperactivité',
            social: 'S\'entendre socialement',
            calm: 'Être plus calme'
        };

        const labels = dataPoints.map(dp => {
            const date = new Date(dp.date);
            return date.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        });

        const datasets = [];
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

        let colorIndex = 0;
        Object.keys(behaviors).forEach(behaviorKey => {
            const values = dataPoints.map(dp => {
                const value = dp.data[`behavior_${behaviorKey}`];
                return value !== undefined ? value : null;
            });

            // Seulement afficher si au moins 2 points de données
            if (values.filter(v => v !== null).length >= 2) {
                datasets.push({
                    label: behaviors[behaviorKey],
                    data: values,
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: colors[colorIndex % colors.length] + '20',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 5,
                    pointBackgroundColor: colors[colorIndex % colors.length],
                });
                colorIndex++;
            }
        });

        // Vérifier aussi le comportement "autre"
        const otherNames = new Set();
        dataPoints.forEach(dp => {
            if (dp.data.behavior_other_name) {
                otherNames.add(dp.data.behavior_other_name);
            }
        });

        otherNames.forEach(otherName => {
            const values = dataPoints.map(dp => {
                if (dp.data.behavior_other_name === otherName) {
                    return dp.data.behavior_other;
                }
                return null;
            });

            if (values.filter(v => v !== null).length >= 2) {
                datasets.push({
                    label: `Autre: ${otherName}`,
                    data: values,
                    borderColor: colors[colorIndex % colors.length],
                    backgroundColor: colors[colorIndex % colors.length] + '20',
                    tension: 0.3,
                    fill: false,
                    pointRadius: 5,
                    pointBackgroundColor: colors[colorIndex % colors.length],
                });
                colorIndex++;
            }
        });

        const ctx = document.getElementById('behaviorTrendChart').getContext('2d');

        // Détruire le graphique précédent s'il existe
        if (window.behaviorChart) {
            window.behaviorChart.destroy();
        }

        window.behaviorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: { size: 12 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        min: -1,
                        max: 2,
                        ticks: {
                            callback: (value) => {
                                const map = { '-1': '✗', '0': '○', '1': '✓', '2': '✓✓' };
                                return map[value] || value;
                            }
                        },
                        title: {
                            display: true,
                            text: 'Niveau d\'amélioration'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }

    static updateMedicationDuration() {
        const allData = StatsHandler.getAllData();
        const durations = [];

        Object.values(allData).forEach(day => {
            if (day.medTime && day.reboundEffect) {
                // Essayer d'extraire l'heure du texte du rebond (format "Vers 14h" ou "14:30")
                const timeMatch = day.reboundEffect.match(/(\d{1,2}):?(\d{0,2})/);
                if (timeMatch) {
                    const medHour = parseInt(day.medTime.split(':')[0]);
                    const reboundHour = parseInt(timeMatch[1]);
                    let duration = reboundHour - medHour;

                    if (duration < 0) duration += 24;
                    if (duration > 0 && duration < 24) {
                        durations.push(duration);
                    }
                }
            }
        });

        const container = document.getElementById('medicationDuration');

        if (durations.length === 0) {
            container.innerHTML = `
                <div class="duration-info">
                    <p>📊 Pas assez de données pour estimer la durée d'effet.</p>
                    <p style="font-size: 0.85rem; color: #6b7280;">Continuez à remplir le formulaire, en particulier le champ "Rebond d'effet".</p>
                </div>
            `;
            return;
        }

        const avgDuration = (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1);
        const minDuration = Math.min(...durations);
        const maxDuration = Math.max(...durations);
        const confidence = Math.min(100, (durations.length / 5) * 100).toFixed(0);

        container.innerHTML = `
            <div class="duration-info">
                <p><strong>⏱️ Durée estimée:</strong> ${avgDuration}h</p>
                <p><strong>🔄 Variation:</strong> ${minDuration}h - ${maxDuration}h</p>
                <p><strong>📈 Confiance:</strong> ${confidence}% (${durations.length} observations)</p>
                <p style="font-size: 0.85rem; color: #6b7280; margin-top: 0.5rem;">Basé sur vos observations de rebond d'effet.</p>
            </div>
        `;
    }

    static updateCorrelations(dataPoints) {
        const correlations = [];

        // Corrélation: Sommeil insuffisant → Irritabilité
        const lowSleepCount = dataPoints.filter(dp => dp.data.sleepHours && dp.data.sleepHours < 6).length;
        if (lowSleepCount > 0) {
            const irritabilityWhenLowSleep = dataPoints
                .filter(dp => dp.data.sleepHours && dp.data.sleepHours < 6)
                .filter(dp => dp.data.sideeffect_irritability === 'worse' || dp.data.sideeffect_irritability === 'first')
                .length;

            if (irritabilityWhenLowSleep / lowSleepCount > 0.5) {
                correlations.push('😴 Manque de sommeil (<6h) → Irritabilité accrue');
            }
        }

        // Corrélation: Bon sommeil → Meilleur focus
        const goodSleepCount = dataPoints.filter(dp => dp.data.sleepHours && dp.data.sleepHours >= 7).length;
        if (goodSleepCount > 0) {
            const goodFocusWhenGoodSleep = dataPoints
                .filter(dp => dp.data.sleepHours && dp.data.sleepHours >= 7)
                .filter(dp => dp.data.behavior_focus === 1 || dp.data.behavior_focus === 2)
                .length;

            if (goodFocusWhenGoodSleep / goodSleepCount > 0.6) {
                correlations.push('✨ Bon sommeil (≥7h) → Meilleur focus');
            }
        }

        // Corrélation: Petit-déjeuner pris → Meilleur comportement
        const breakfastTaken = dataPoints.filter(dp => dp.data.breakfastTime).length;
        if (breakfastTaken > 0) {
            const goodBehaviorWithBreakfast = dataPoints
                .filter(dp => dp.data.breakfastTime)
                .filter(dp => {
                    const focusGood = dp.data.behavior_focus === 1 || dp.data.behavior_focus === 2;
                    const hungerGood = dp.data.sideeffect_appetite !== 'worse' && dp.data.sideeffect_appetite !== 'first';
                    return focusGood && hungerGood;
                })
                .length;

            if (goodBehaviorWithBreakfast / breakfastTaken > 0.6) {
                correlations.push('🥣 Petit-déjeuner pris → Meilleure gestion générale');
            }
        }

        // Corrélation: Hyperactivité vs Calm
        const hasHyperactivityData = dataPoints.filter(dp => dp.data.behavior_hyperactivity !== undefined).length > 0;
        const hasCalmData = dataPoints.filter(dp => dp.data.behavior_calm !== undefined).length > 0;

        if (hasHyperactivityData && hasCalmData) {
            const correlation = dataPoints.filter(dp => {
                return (dp.data.behavior_hyperactivity === 2 && dp.data.behavior_calm === 2) ||
                       (dp.data.behavior_hyperactivity === -1 && dp.data.behavior_calm === -1);
            }).length;

            if (correlation > dataPoints.length * 0.6) {
                correlations.push('🔄 Hyperactivité réduite ↔ Calme amélioré (corrélation positive)');
            }
        }

        // Corrélation: Siestes → Moins d'irritabilité?
        const withNaps = dataPoints.filter(dp => dp.data.naps && dp.data.naps.trim() !== '').length;
        if (withNaps > 2) {
            const betterIrritabilityWithNaps = dataPoints
                .filter(dp => dp.data.naps && dp.data.naps.trim() !== '')
                .filter(dp => dp.data.sideeffect_irritability === 'improving' || dp.data.sideeffect_irritability === 'none')
                .length;

            if (betterIrritabilityWithNaps / withNaps > 0.6) {
                correlations.push('😴 Siestes → Irritabilité réduite');
            }
        }

        const container = document.getElementById('correlationsList');
        if (correlations.length === 0) {
            container.innerHTML = '<li style="color: #6b7280;">Pas assez de données pour détecter des corrélations. Continuez le suivi!</li>';
        } else {
            container.innerHTML = correlations.map(c => `<li>🔗 ${c}</li>`).join('');
        }
    }

    static updateSideEffectsSummary(dataPoints) {
        const sideEffects = ['appetite', 'stomach', 'irritability', 'anxiety', 'sleep', 'flat', 'withdrawal'];
        const sideEffectLabels = {
            appetite: 'Appétit diminué',
            stomach: 'Mal d\'estomac / Maux de tête',
            irritability: 'Irritabilité',
            anxiety: 'Anxiété / Nervosité',
            sleep: 'Trouble du sommeil',
            flat: '"Plat" ou sans émotions',
            withdrawal: 'Retrait social'
        };

        const summary = {};

        sideEffects.forEach(effect => {
            const counts = { first: 0, improving: 0, none: 0, worse: 0 };

            dataPoints.forEach(dp => {
                const value = dp.data[`sideeffect_${effect}`];
                if (value && counts.hasOwnProperty(value)) {
                    counts[value]++;
                }
            });

            if (Object.values(counts).some(v => v > 0)) {
                summary[effect] = { label: sideEffectLabels[effect], counts };
            }
        });

        // Inclure les effets secondaires "autres"
        const otherEffectNames = new Set();
        dataPoints.forEach(dp => {
            for (let i = 1; i <= 2; i++) {
                if (dp.data[`sideeffect_other${i}_name`]) {
                    otherEffectNames.add({ name: dp.data[`sideeffect_other${i}_name`], index: i });
                }
            }
        });

        otherEffectNames.forEach(effectInfo => {
            const counts = { first: 0, improving: 0, none: 0, worse: 0 };
            dataPoints.forEach(dp => {
                const value = dp.data[`sideeffect_other${effectInfo.index}`];
                if (value && counts.hasOwnProperty(value)) {
                    counts[value]++;
                }
            });

            if (Object.values(counts).some(v => v > 0)) {
                summary[`other_${effectInfo.name}`] = { label: `Autre: ${effectInfo.name}`, counts };
            }
        });

        const container = document.getElementById('sideEffectsList');
        if (Object.keys(summary).length === 0) {
            container.innerHTML = '<li style="color: #6b7280;">Aucun effet secondaire rapporté.</li>';
            return;
        }

        const summaryHTML = Object.values(summary).map(effect => {
            const counts = effect.counts;
            const total = Object.values(counts).reduce((a, b) => a + b, 0);

            const statusEmojis = [];
            if (counts.worse > 0) statusEmojis.push(`✗ S'aggrave (${counts.worse})`);
            if (counts.first > 0) statusEmojis.push(`1️⃣ Nouveau (${counts.first})`);
            if (counts.improving > 0) statusEmojis.push(`✓ Améliore (${counts.improving})`);
            if (counts.none > 0) statusEmojis.push(`○ Aucun (${counts.none})`);

            return `<li><strong>${effect.label}</strong><br/><small>${statusEmojis.join(' | ')}</small></li>`;
        }).join('');

        container.innerHTML = summaryHTML;
    }
}

// Initialiser les stats quand le document est prêt
document.addEventListener('DOMContentLoaded', () => {
    window.StatsHandler = StatsHandler;
});
