const { createApp } = Vue;

createApp({
	data() {
		return {
			usableNotes: ['A#4', 'A4', 'B4', 'C5', 'D#5', 'D5', 'E4', 'E5', 'G#4', 'G4'],
			allComposition: [],
			oscillatorTypes: ['sine', 'square', 'triangle', 'sawtooth'],
			oscillatorType: 'square',
		};
	},
	methods: {
		addOverlay(note, i, j, width = '400') {
			let index = `${i}_${j}`;
			let blockCount = width / 100;
			let component = this.allComposition.find((e) => e.note == note);
			component.filled[index] = {
				note: note,
				start: ((i - 1) * 4 + (j - 1)) * 0.5,
				duration: blockCount * 0.5,
			};
			this.singlePlay(note);
			this.$nextTick(() => {
				let overlay = document.querySelector(`#overlay_${component.noteCode}_${i}_${j}`);
				// add resize observer
				let ro = new ResizeObserver((entries) => {
					for (let entry of entries) {
						let subBlock = overlay.parentElement;

						// Calculate the new width
						let newWidth = (entry.contentRect.width / subBlock.offsetWidth) * 100;

						// Round to the nearest multiple of 100
						newWidth = Math.round(newWidth / 100) * 100;

						// Set the new width
						overlay.style.width = newWidth + '%';
						component.filled[index] = {
							...component.filled[index],
							duration: (newWidth / 100) * 0.5,
						};
					}
				});
				ro.observe(overlay);
			});
		},
		checkFilled(note, index) {
			let component = this.allComposition.find((e) => e.note == note);

			if (!component) return false;

			if (component.filled[index]) {
				return true;
			} else {
				return false;
			}
		},
		play() {
			const oscillators = [];
			NOTES = [];
			audioContext = new (window.AudioContext || window.webkitAudioContext)();

			let totalDuration = 0;
			let lastX = 0;
			let lastY = 0;

			// allComposition filled will be pushed into NOTES
			this.allComposition.forEach((e) => {
				for (i in e.filled) {
					let lastPossibleX = parseInt(i.split('_')[0]);
					let lastPossibleY = parseInt(i.split('_')[1]);
					if (lastPossibleX > lastX) {
						lastX = lastPossibleX;
						lastY = lastPossibleY;
					} else if (lastPossibleX == lastX && lastPossibleY > lastY) {
						lastY = lastPossibleY;
					}

					NOTES.push({ ...e.filled[i] });
				}
			});
			totalDuration = ((lastX - 1) * 4 + lastY) * 500;
			console.log(totalDuration);
			//const totalDuration = (NOTES[NOTES.length - 1].start + NOTES[NOTES.length - 1].duration) * 1000;

			this.startPlaying(totalDuration);

			NOTES.forEach((note, index) => {
				const oscillator = audioContext.createOscillator();
				const gainNode = audioContext.createGain();
				const biquadFilter = audioContext.createBiquadFilter();
				oscillator.type = this.oscillatorType;
				oscillator.frequency.value = noteToFrequency(note.note);
				oscillator.connect(audioContext.destination);

				gainNode.connect(biquadFilter);
				biquadFilter.connect(audioContext.destination);

				// ADSR zarfı ayarları
				let attack = 0.1; // saniye cinsinden attack süresi
				let decay = 0.1; // saniye cinsinden decay süresi
				let sustain = 0.1; // sustain seviyesi (0 ile 1 arası)
				let release = 0.3; // saniye cinsinden release süresi

				let startTime = note.start;

				// Attack ve Decay sürelerini ayarla
				gainNode.gain.setValueAtTime(0, startTime);
				gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
				gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);

				// Release süresini ayarla
				gainNode.gain.setValueAtTime(sustain, startTime + attack + decay);
				gainNode.gain.linearRampToValueAtTime(0, startTime + attack + decay + release);

				oscillator.start(startTime);
				oscillator.stop(startTime + note.duration);

				// Oluşturulan osilatörleri sakla
				oscillators.push(oscillator);
			});

			// Tüm sesler çalındıktan sonra osilatörleri sıfırla ve bağlantıları kaldır
			setTimeout(() => {
				oscillators.forEach((oscillator) => {
					oscillator.stop();
					oscillator.disconnect();
				});
			}, totalDuration);
		},
		singlePlay(note) {
			audioContext = new (window.AudioContext || window.webkitAudioContext)();

			const oscillator = audioContext.createOscillator();
			const gainNode = audioContext.createGain();
			const biquadFilter = audioContext.createBiquadFilter();
			oscillator.type = this.oscillatorType;
			oscillator.frequency.value = noteToFrequency(note);
			oscillator.connect(audioContext.destination);

			gainNode.connect(biquadFilter);
			biquadFilter.connect(audioContext.destination);

			// ADSR zarfı ayarları
			let attack = 0.1; // saniye cinsinden attack süresi
			let decay = 0.1; // saniye cinsinden decay süresi
			let sustain = 0.1; // sustain seviyesi (0 ile 1 arası)
			let release = 0.3; // saniye cinsinden release süresi

			let startTime = 0;

			// Attack ve Decay sürelerini ayarla
			gainNode.gain.setValueAtTime(0, startTime);
			gainNode.gain.linearRampToValueAtTime(1, startTime + attack);
			gainNode.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);

			// Release süresini ayarla
			gainNode.gain.setValueAtTime(sustain, startTime + attack + decay);
			gainNode.gain.linearRampToValueAtTime(0, startTime + attack + decay + release);

			oscillator.start();
			oscillator.stop(0.5);
		},
		startPlaying(totalDuration) {
			const pointer = document.querySelector('#pointer');
			let currentLeft = 50; // Başlangıç konumu

			// Her saniyede pointer'yi 100px kaydır
			const interval = setInterval(() => {
				currentLeft += 1;
				pointer.style.left = currentLeft + 'px';
			}, 10);

			setTimeout(() => {
				clearInterval(interval);
				pointer.style.left = '50px';
			}, totalDuration);
		},
		allowDrop(event) {
			event.preventDefault();
		},
		drop(event, target) {
			event.preventDefault();
			let originSubBlock = document.querySelectorAll('.sub-block')[event.dataTransfer.getData('index')];

			let width = event.dataTransfer.getData('width'); // retrieve the width
			let blockCount = width / 100;
			// remove the filled class from the original sub-blocks
			let parentBlock = originSubBlock.parentNode.parentNode;
			let subBlocks = Array.from(parentBlock.querySelectorAll('.sub-block'));
			let index = subBlocks.indexOf(originSubBlock);

			for (let i = 0; i < blockCount; i++) {
				subBlocks[index + i].classList.remove('filled');
			}
			originSubBlock.removeChild(originSubBlock.firstChild);
			addOverlay(target, width); // call with the width
		},
		exportation() {
			let jsonString = JSON.stringify(this.allComposition); // Veriyi JSON formatına çevir

			let blob = new Blob([jsonString], { type: 'application/json' });
			// Yukarıdaki satırda Blob nesnesi oluşturduk. Bu nesne binary veriyi temsil eder ve dosya indirme işleminde kullanılabilir.
			let url = window.URL.createObjectURL(blob);
			// Blob nesnesinden bir URL oluşturduk. Bu URL'yi bir <a> etiketinde veya window.location.href'te kullanabiliriz.

			let a = document.createElement('a');
			// <a> etiketi oluşturduk. Bu etiketi, dosyayı indirmek için kullanacağız.
			a.href = url;
			a.download = 'data.json'; // İndirilecek dosyanın adını belirledik
			a.click(); // <a> etiketini tıklarız ki dosya indirme işlemi başlasın
		},
		importation() {
			let fileInput = document.querySelector('#fileInput');
			fileInput.addEventListener('change', (e) => {
				let file = e.target.files[0];
				let reader = new FileReader();
				reader.readAsText(file);
				reader.onload = (e) => {
					let json = JSON.parse(e.target.result);
					this.allComposition = [];
					json.forEach((e) => {
						this.allComposition.push({
							note: e.note,
							noteCode: e.noteCode,
							filled: { ...e.filled },
						});
					});
				};
			});
		},
	},
	mounted() {
		// loop over usableNotes, push to allComposition variable
		for (let i = 0; i < this.usableNotes.length; i++) {
			this.allComposition.push({
				note: this.usableNotes[i],
				noteCode: this.usableNotes[i].replace('#', '-'),
				filled: {},
			});
		}
		this.importation();
	},
}).mount('#app');
