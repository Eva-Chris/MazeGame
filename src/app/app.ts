// app.component.ts
import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

interface Position {
  x: number;
  y: number;
}

interface Checkpoint {
  x: number;
  y: number;
  type: 'birthday' | 'find-item' | 'proverbs' | 'timeline' | 'emoji-quiz' | 'map-quiz' | 'multi-quiz';
  completed: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit {
  @ViewChild('gameContainer') gameContainer!: ElementRef;
  currentScreen: 'intro' | 'game' | 'checkpoint' | 'win' = 'intro';

  private map!: L.Map;
  private locations = [
    { name: 'Wrong 1', coords: [35.2509, 25.1499] as L.LatLngExpression, correct: false },
    { 
      name: 'Correct Spot', 
      coords: [35.3596, 25.0258] as L.LatLngExpression, 
      correct: true,
      image: 'first-date.jpg', 
      caption: 'Ποιος Πικάσο;' 
    },
    { name: 'Wrong 2', coords: [35.3215, 25.1331] as L.LatLngExpression, correct: false },
    { name: 'Wrong 3', coords: [35.3169, 25.0966] as L.LatLngExpression, correct: false }
  ];
  
  noButtonStyle: { position: string; left: string; top: string; transform?: string } = { position: 'relative', left: '0px', top: '0px' };
  noButtonClicked = false;
    
  // Game state
  playerPos: Position = { x: 1, y: 1 };
  goalPos: Position = { x: 18, y: 13 };
  cellSize = 60; // Cell size for maze
  
  maze = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // x:4, y:1 (map-quiz)
    [0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,0,1,1,1,0,1,1,1,1,1,1,1,2,1,1,1,1,0], // x:14, y:3 (proverbs)
    [0,1,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0],
    [0,1,1,1,1,1,1,2,0,1,1,1,1,1,1,1,1,1,1,0], // x:7, y:5 (find-item)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0], // x:18, y:6 (timeline)
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,0,0], // x:8, y:9 (multi-quiz)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,0], // x:1, y:13 (emoji) & x:16, y:13 (birthday)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];

  checkpoints: Checkpoint[] = [
    { x: 7, y: 5, type: 'find-item', completed: false },
    { x: 16, y: 13, type: 'birthday', completed: false },
    { x: 4, y: 1, type: 'map-quiz', completed: false },
    { x: 18, y: 6, type: 'timeline', completed: false },
    { x: 1, y: 13, type: 'emoji-quiz', completed: false },
    { x: 14, y: 3, type: 'proverbs', completed: false },
    { x: 8, y: 9, type: 'multi-quiz', completed: false },
  ];

  currentCheckpoint: Checkpoint | null = null;

  currentQuestionIndex = 0;
  quizQuestions = [
    {
      q: "Τι σου έχω πει ότι θεωρώ sexy πάνω σου;",
      options: ["Τα μαλλιά σου (ποια;)", "Τη φωνή σου", "Τα μάτια σου", "Τα χέρια σου"],
      correct: 1
    },
    {
      q: "Πού πήγαμε στα γενέθλιά μου;",
      options: ["Σφενδύλι", "Ρέθυμνο", "Αρχάνες", "Γούβες"],
      correct: 0
    },
    {
      q: "Ποιο είναι το αγαπημένο μου junk food;",
      options: ["Γύρος", "Burger", "Σούσι", "Μακαρόνια"],
      correct: 2
    },
    {
      q: "Ποιο πίνακα σου είπα ότι θέλω να αναπαραστήσουμε;",
      options: ["The Kiss - Edvard Munch", "We Rose Up Slowly - Roy Lichtenstein", "In Bed, The Kiss - Henri de Toulouse-Lautrec", "The Kiss - Gustav Klimt"],
      correct: 3
    },
    {
      q: ";",
      options: ["Perfect", "Lover", "All of Me", "Your Song"],
      correct: 1
    }
  ];
  
  // Checkpoint answers
  birthdayAnswer = '';
  birthdayError = '';
  correctBirthday = '2001-04-27';
  
  // Find item checkpoint
  findItems = ['🎮', '📱', '⌚', '🎧', '👓', '💻', '🎹', '📷', 
                '⚽', '🎸', '📚', '☕', '🍕', '🎬', '🎨', '🔑'];
  targetItem = '👓';
  findItemError = '';

  timelineOrder = { img1: '', img2: '', img3: '', img4: '', img5: '', img6: '' };
  timelineError = '';

  proverbsAnswers = {
    p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: ''
  };
  proverbsError = '';

  emojiError = '';

  // Letter animation
  envelopeOpened = false;
  letterVisible = false;

  ngOnInit() {}

  startGame() {
    this.currentScreen = 'game';
  }

  initMap() {
    const heartIcon = L.icon({
      iconUrl: 'favicon.ico', 
      iconSize: [40, 40], 
      iconAnchor: [20, 40]
    });

    setTimeout(() => {
      if (this.map) this.map.remove();
      this.map = L.map('map-id').setView([35.3386, 25.1420], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

      this.locations.forEach(loc => {
        const marker = L.marker(loc.coords, { icon: heartIcon }).addTo(this.map);
        
        marker.on('click', () => {
          if (loc.correct) {
            // Create the HTML content for the popup
            const popupContent = `
              <div style="text-align: center; font-family: sans-serif;">
                <img src="${loc.image}" style="width: 200px; border-radius: 10px; margin-bottom: 8px;">
                <p style="font-weight: bold; color: #ff4d6d;">${loc.caption}</p>
                <button id="finish-map-btn" style="background: #ff4d6d; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">Συνέχισε το παιχνίδι!</button>
              </div>
            `;

            marker.bindPopup(popupContent).openPopup();

            // Add a listener to the button inside the popup
            setTimeout(() => {
              const btn = document.getElementById('finish-map-btn');
              if (btn) {
                btn.onclick = () => this.completeCheckpoint();
              }
            }, 100);

          } else {
            alert("Όχι εδώ! Ψάξε ξανά...");
          }
        });
      });
    }, 100);
  }

  moveNoButton() {
    // Move button to random position on screen, avoiding the center where Yes button is
    const randomLeft = Math.random() * 80 + 10;
    const randomTop = Math.random() * 80 + 10;
    
    this.noButtonStyle = {
      position: 'fixed',
      left: `${randomLeft}%`,
      top: `${randomTop}%`,
      transform: 'translate(-50%, -50%)'
    };
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.currentScreen !== 'game') return;

    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    let newX = this.playerPos.x;
    let newY = this.playerPos.y;

    if (key === 'w' || key === 'arrowup') newY--;
    if (key === 's' || key === 'arrowdown') newY++;
    if (key === 'a' || key === 'arrowleft') newX--;
    if (key === 'd' || key === 'arrowright') newX++;

    // Check if new position is valid
    if (this.maze[newY] && this.maze[newY][newX] !== 0) {
      this.playerPos = { x: newX, y: newY };
      
      // Check for checkpoint
      const checkpoint = this.checkpoints.find(
        cp => cp.x === newX && cp.y === newY && !cp.completed
      );
      
      if (checkpoint) {
        this.currentCheckpoint = checkpoint;
        this.currentScreen = 'checkpoint';
        if (checkpoint.type === 'map-quiz') {
          this.initMap(); 
        }
      }
      
      // Check for win
      if (newX === this.goalPos.x && newY === this.goalPos.y) {
        const allCompleted = this.checkpoints.every(cp => cp.completed);
        // if (allCompleted) {
          this.currentScreen = 'win';
        // }
      }
    }
  }

  getPlayerStyle() {
    return {
      left: this.playerPos.x * this.cellSize + 'px',
      top: this.playerPos.y * this.cellSize + 'px'
    };
  }

  getGoalStyle() {
    return {
      left: this.goalPos.x * this.cellSize + 'px',
      top: this.goalPos.y * this.cellSize + 'px'
    };
  }

  isCheckpointCompleted(x: number, y: number): boolean {
    const checkpoint = this.checkpoints.find(cp => cp.x === x && cp.y === y);
    return checkpoint ? checkpoint.completed : false;
  }

  checkBirthday() {
    if (this.birthdayAnswer === this.correctBirthday) {
      this.completeCheckpoint();
    } else {
      this.birthdayError = 'ΣΟΒΑΡΑ ΤΟ ΕΚΑΝΕΣ ΛΑΘΟΣ;;;';
    }
  }

  checkFindItem(item: string) {
    if (item === this.targetItem) {
      this.completeCheckpoint();
    } else {
      this.findItemError = 'Όχι ακριβώς! Συνέχισε να ψάχνεις...';
    }
  }

  checkProverbs() {
    const a = this.proverbsAnswers;
    const isCorrect = 
      a.p1.toLowerCase().trim() === 'κοκόρου' &&
      a.p2.toLowerCase().trim() === 'γιαννάκης' &&
      a.p3.toLowerCase().trim() === 'πίνει' &&
      a.p4.toLowerCase().trim() === 'βαφτίσαμε' &&
      (a.p5.toLowerCase().trim() === 'μπορεί' || a.p5.toLowerCase().trim() === 'πονεί') &&
      a.p6.toLowerCase().trim() === 'θεριό' &&
      a.p7.toLowerCase().trim() === 'προκοπή';

    if (isCorrect) {
      this.completeCheckpoint();
    } else {
      this.proverbsError = 'Κάποια παροιμία δεν είναι σωστή! Δες το βίντεο για βοήθεια...';
    }
  }

  checkTimeline() {
    const o = this.timelineOrder;
    
    if (String(o.img1) === '2' && 
        String(o.img2) === '4' && 
        String(o.img3) === '1' &&
        String(o.img4) === '3' &&
        String(o.img5) === '6' &&
        String(o.img6) === '5') {
      this.completeCheckpoint();
    } else {
      this.timelineError = 'Χμμ, μάλλον οι αναμνήσεις σου είναι λίγο μπερδεμένες! Δοκίμασε ξανά.';
    }
  }

  checkEmoji(selectedEmoji: string) {
    if (selectedEmoji === '😏') {
      this.completeCheckpoint();
    } else {
      this.emojiError = 'Όχι, αυτό το αντέχεις νομίζω...';
    }
  }

  completeCheckpoint() {
    if (this.currentCheckpoint) {
      this.currentCheckpoint.completed = true;
      this.currentCheckpoint = null;
      this.currentScreen = 'game';
      setTimeout(() => {
        this.gameContainer?.nativeElement.focus();
      }, 10);
      this.birthdayAnswer = '';
      this.birthdayError = '';
      this.findItemError = '';
    }
  }

  getCompletedCheckpointsCount(): number {
    return this.checkpoints.filter(cp => cp.completed).length;
  }

  openEnvelope() {
    this.envelopeOpened = true;
    setTimeout(() => {
      this.letterVisible = true;
    }, 600);
  }

  handleQuizAnswer(index: number) {
    if (index === this.quizQuestions[this.currentQuestionIndex].correct) {
      if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
        this.currentQuestionIndex++;
      } else {
        alert("Συγχαρητήρια! Τα βρήκες όλα! ❤️");
        this.completeCheckpoint();
        this.currentQuestionIndex = 0; // Reset for next time if needed
      }
    } else {
      alert("Λάθος! Ξαναπροσπάθησε από την αρχή...");
      this.currentQuestionIndex = 0; // Penalty: start over!
    }
  }
}