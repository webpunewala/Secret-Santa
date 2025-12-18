document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.getElementById('nameInput');
    const addBtn = document.getElementById('addBtn');
    const nameList = document.getElementById('nameList');
    const countBadge = document.getElementById('countBadge');
    const wheelModeBtn = document.getElementById('wheelModeBtn'); // New Button
    const resultsArea = document.getElementById('resultsArea');
    const pairsList = document.getElementById('pairsList');
    const resetBtn = document.getElementById('resetBtn');

    // Modal elements
    const wheelModal = document.getElementById('wheelModal');
    const closeModal = document.querySelector('.close-modal');
    const spinBtn = document.getElementById('spinBtn');
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const turnIndicator = document.getElementById('turnIndicator');
    const wheelResult = document.getElementById('wheelResult');

    let participants = [];
    let currentPairs = null;
    let wheelTurnIndex = 0;
    let isSpinning = false;

    // Gift Data
    const gifts = [
        { name: 'Dairy Milk', img: './chocolate.png' },
        { name: 'Biscuits', img: './biscuits.png' },
        { name: 'Sleek Pen', img: './pen.png' },
        { name: 'Kurkure', img: './chips.png' },
        { name: 'Surprise Box', img: './giftbox.png' }
    ];

    // Event Listeners
    addBtn.addEventListener('click', addName);
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addName();
    });
    // generateBtn listener removed
    wheelModeBtn.addEventListener('click', startWheelMode);
    resetBtn.addEventListener('click', resetMatches);

    closeModal.addEventListener('click', () => {
        wheelModal.classList.remove('active');
        isSpinning = false;
    });

    spinBtn.addEventListener('click', handleSpin);

    function addName() {
        const name = nameInput.value.trim();

        if (!name) return;

        if (participants.includes(name)) {
            shakeInput();
            return;
        }

        participants.push(name);
        nameInput.value = '';
        renderParticipants();
        nameInput.focus();
    }

    function removeName(name) {
        participants = participants.filter(p => p !== name);
        renderParticipants();
        resetMatches();
    }

    function renderParticipants() {
        countBadge.textContent = participants.length;
        nameList.innerHTML = '';

        if (participants.length === 0) {
            nameList.innerHTML = '<p class="empty-state">No participants added yet.</p>';
            return;
        }

        participants.forEach(name => {
            const tag = document.createElement('div');
            tag.className = 'name-tag';
            tag.innerHTML = `
                <span>${escapeHtml(name)}</span>
                <button class="remove-btn" aria-label="Remove ${escapeHtml(name)}">&times;</button>
            `;

            tag.querySelector('.remove-btn').addEventListener('click', () => removeName(name));
            nameList.appendChild(tag);
        });
    }

    function startWheelMode() {
        if (!validateParticipants()) return;

        const matches = generateMatches();
        if (!matches) return;

        currentPairs = matches;
        wheelTurnIndex = 0;

        // Setup Wheel UI
        wheelModal.classList.add('active');
        setupTurn();
    }

    function setupTurn() {
        if (wheelTurnIndex >= currentPairs.length) {
            turnIndicator.textContent = "All gifts assigned! 🎅";
            spinBtn.style.display = 'none';
            wheelResult.textContent = "Game Over";
            return;
        }

        const currentGiver = currentPairs[wheelTurnIndex].giver;
        turnIndicator.innerHTML = `It's <span style="color:var(--accent-color)">${escapeHtml(currentGiver)}</span>'s turn!`;
        spinBtn.style.display = 'inline-block';
        spinBtn.disabled = false;
        wheelResult.textContent = "";

        drawWheel(); // Default state
    }

    function handleSpin() {
        if (isSpinning) return;
        isSpinning = true;
        spinBtn.disabled = true;

        const currentTarget = currentPairs[wheelTurnIndex].receiver;
        spinWheelToTarget(currentTarget, () => {
            isSpinning = false;

            // Select Random Gift
            const randomGift = gifts[Math.floor(Math.random() * gifts.length)];

            wheelResult.innerHTML = `
                <div>You got <span style="color:var(--accent-color)">${escapeHtml(currentTarget)}</span>! 🎁</div>
                <div class="gift-reveal">
                    <p>Gift: ${randomGift.name}</p>
                    <img src="${randomGift.img}" alt="${randomGift.name}" class="gift-img">
                </div>
            `;

            wheelTurnIndex++;
            setTimeout(() => {
                // Optional: delay before next turn setup
                // setupTurn(); 
                // Let user close or click something? 
                // For flow, let's keep the button disabled and change text
                spinBtn.style.display = 'inline-block';
                spinBtn.textContent = "Next Person >>";
                spinBtn.disabled = false;

                // One-time listener to advance
                const advance = () => {
                    spinBtn.removeEventListener('click', advance);
                    spinBtn.textContent = "SPIN!";
                    spinBtn.addEventListener('click', handleSpin);
                    setupTurn();
                };
                spinBtn.removeEventListener('click', handleSpin);
                spinBtn.addEventListener('click', advance);

            }, 2000);
        });
    }

    // --- Core Match Logic ---

    function validateParticipants() {
        if (participants.length < 2) {
            alert('You need at least 2 participants!');
            return false;
        }
        return true;
    }

    function generateMatches() {
        const shuffled = shuffleAndDerange([...participants]);
        if (!shuffled) {
            alert('Could not generate valid pairs. Try again.');
            return null;
        }

        // Return array of objects
        return participants.map((giver, i) => ({
            giver,
            receiver: shuffled[i]
        }));
    }

    function shuffleAndDerange(arr) {
        let maxAttempts = 100;
        let valid = false;
        let shuffled = [];

        while (!valid && maxAttempts > 0) {
            shuffled = [...arr];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            valid = true;
            for (let i = 0; i < arr.length; i++) {
                if (arr[i] === shuffled[i]) {
                    valid = false;
                    break;
                }
            }
            maxAttempts--;
        }
        return valid ? shuffled : null;
    }

    // --- UI Helpers ---

    function displayListMatches(matches) {
        pairsList.innerHTML = '';
        matches.forEach((pair, i) => {
            const pairEl = document.createElement('div');
            pairEl.className = 'result-pair';
            pairEl.innerHTML = `
                <span class="giver">${escapeHtml(pair.giver)}</span>
                <span class="arrow">→</span>
                <span class="receiver">${escapeHtml(pair.receiver)}</span>
            `;
            pairEl.style.animationDelay = `${i * 0.1}s`;
            pairEl.style.animation = `slideDown 0.4s ease-out forwards ${i * 0.1}s`;
            pairEl.style.opacity = '0';
            pairsList.appendChild(pairEl);
        });

        resultsArea.classList.add('active');
        resultsArea.scrollIntoView({ behavior: 'smooth' });
    }

    function resetMatches() {
        resultsArea.classList.remove('active');
        pairsList.innerHTML = '';
        wheelTurnIndex = 0;
        currentPairs = null;
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function shakeInput() {
        nameInput.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], { duration: 300 });
    }

    // --- Wheel Canvas Logic ---

    // Config
    const colors = ['#f43f5e', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    let currentRotation = 0; // Cumulative rotation in radians

    function drawWheel(rotationOffset = 0) {
        if (!participants.length) return;
        const width = canvas.width;
        const height = canvas.height;
        const cx = width / 2;
        const cy = height / 2;
        const radius = width / 2 - 10;
        const arc = (2 * Math.PI) / participants.length;

        ctx.clearRect(0, 0, width, height);

        participants.forEach((name, i) => {
            const angle = i * arc + rotationOffset - Math.PI / 2; // -PI/2 to start at top

            ctx.beginPath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, radius, angle, angle + arc);
            ctx.lineTo(cx, cy);
            ctx.fill();
            ctx.stroke();

            // Text
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(angle + arc / 2);
            ctx.textAlign = "right";
            ctx.fillStyle = "#fff";
            ctx.font = "bold 16px Inter";
            ctx.fillText(name, radius - 20, 5);
            ctx.restore();
        });
    }

    function spinWheelToTarget(targetName, callback) {
        const targetIndex = participants.indexOf(targetName);
        if (targetIndex === -1) return;

        const arc = (2 * Math.PI) / participants.length;

        // Calculate the angle where the target center is
        // We want this angle to align with the pointer (which is at -PI/2 visual, basically Top 0 radians in draws if we didn't offset)
        // Actually pointer is at Top. Canvas 0 is Right. 
        // Our draw logic starts i*arc - PI/2. So index 0 starts at Top.
        // We want the wheel to STOP such that the Target Segment is at the top.
        // Target Segment starts at: index * arc. Center at index * arc + arc/2.
        // We need to rotate NEGATIVE (counter-clockwise) or POSITIVE (clockwise) effectively.

        // Let's think in terms of "Final Rotation".
        // The pointer is static at top (angle 270deg or -90deg or 3*PI/2).
        // If we rotate the CANVAS context or the angles, the visual changes.
        // In `drawWheel(offset)`, if offset=0, index 0 is at Top.
        // To get index K to top, we need to rotate result by covering the distance.
        // Rotation needed = -(Index * Arc + Arc/2)

        // Add extra spins (3 to 5 full rotations)
        const spins = 5;
        const extraRot = spins * 2 * Math.PI;

        // Randomize landing within the segment slightly for realism
        const randomOffset = (Math.random() - 0.5) * (arc * 0.8);

        // Target rotation (Visual):
        // We want the Final visual angle of the Target Center to be at TOP.
        // Currently Target Center is at (Index * Arc + Arc/2) relative to the wheel start.
        // If we rotate the wheel by Theta, the new position is (Pos + Theta).
        // We want (Pos + Theta) % 2PI = 0 (Top, if we treat Top as 0 in our logic, but we drew Top as -PI/2)
        // Wait, easier:
        // Current 'Offset' is what we pass to drawWheel.
        // drawWheel draws index 0 at (Offset - PI/2).
        // Target is index `targetIndex`.
        // Its center is at (targetIndex * arc + arc/2 + Offset - PI/2).
        // We want this to equal -PI/2 (Top) or 3PI/2.
        // So: targetIndex * arc + arc/2 + Offset = 0 (modulo 2PI)
        // => Offset = -(targetIndex * arc + arc/2)

        const targetRotation = -(targetIndex * arc + arc / 2) + randomOffset;

        // Ensure we spin forward (positive delta)
        // Current absolute rotation is `currentRotation`.
        // We want to reach `targetRotation` but lots of turns ahead.
        // Normalize current to 0..2PI? No, keep it continuous.

        // Find next equivalent angle > currentRotation + minimum spin
        let finalRotation = targetRotation;
        while (finalRotation < currentRotation + extraRot) {
            finalRotation += 2 * Math.PI;
        }

        // Animate
        const duration = 4000; // ms
        const startTime = performance.now();
        const startRot = currentRotation;

        function animate(time) {
            const elapsed = time - startTime;
            if (elapsed >= duration) {
                currentRotation = finalRotation;
                drawWheel(currentRotation);
                callback();
                return;
            }

            // Ease Out Quart
            const t = elapsed / duration;
            const ease = 1 - Math.pow(1 - t, 4);

            currentRotation = startRot + (finalRotation - startRot) * ease;
            drawWheel(currentRotation);
            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }
});

