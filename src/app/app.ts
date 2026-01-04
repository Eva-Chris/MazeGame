import { Component, OnInit, HostListener, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

// INTERFACES
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

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
}

interface MapLocation {
  name: string;
  coords: L.LatLngExpression;
  correct: boolean;
  image?: string;
  caption?: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  @ViewChild('gameContainer') gameContainer!: ElementRef;

  // SCREEN & UI STATE
  currentScreen: 'intro' | 'game' | 'checkpoint' | 'win' = 'intro';
  
  // Notification state
  showNotification = false;
  notificationTitle = '';
  notificationMessage = '';
  notificationType: 'success' | 'error' = 'success';
  
  // No button state
  noButtonStyle: { position: string; left: string; top: string; transform?: string } = {
    position: 'relative',
    left: '0px',
    top: '0px'
  };
  
  // Win screen state
  envelopeOpened = false;
  letterVisible = false;

  // MAZE & GAME CONFIGURATION
  cellSize = 60;
  playerPos: Position = { x: 1, y: 1 };
  goalPos: Position = { x: 18, y: 13 };
  
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

  // CHECKPOINT DATA & ANSWERS

  // Birthday Checkpoint
  birthdayAnswer = '';
  birthdayError = '';
  correctBirthday = '2001-04-27';

  // Find Item Checkpoint
  findItems = [
    '🎮', '📱', '⌚', '🎧', '👓', '💻', '🎹', '📷',
    '⚽', '🎸', '📚', '☕', '🍕', '🎬', '🎨', '🔑'
  ];
  targetItem = '👓';
  findItemError = '';

  // Timeline Checkpoint
  timelineOrder = { 
    img1: '', img2: '', img3: '', img4: '', img5: '', img6: '' 
  };
  timelineError = '';

  // Proverbs Checkpoint
  proverbsAnswers = {
    p1: '', p2: '', p3: '', p4: '', p5: '', p6: '', p7: ''
  };
  proverbsError = '';

  // Emoji Checkpoint
  emojiError = '';

  // Multi-Quiz Checkpoint
  currentQuestionIndex = 0;
  quizQuestions: QuizQuestion[] = [
    {
      q: "Τι σου έχω πει ότι θεωρώ sexy πάνω σου;",
      options: ["Τα μαλλιά σου (ποια;)", "Τη φωνή σου", "Τα μάτια σου", "Τα χέρια σου"],
      correct: 1
    },
    {
      q: "Που πήγαμε στα γενέθλιά μου;",
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
      options: [
        "The Kiss - Edvard Munch",
        "We Rose Up Slowly - Roy Lichtenstein",
        "In Bed, The Kiss - Henri de Toulouse-Lautrec",
        "The Kiss - Gustav Klimt"
      ],
      correct: 3
    },
    {
      q: "Ποιο βιβλίο διάβαζα στη δουλειά όταν ξεκινήσαμε να φλερτάρουμε;",
      options: [
        "Γράμματα στη Μιλένα",
        "Στις όχθες του ποταμού Πιέδρα κάθισα κι έκλαψα",
        "Αιματοβαμμένος μεσημβρινός",
        "Εκατό Χρόνια Μοναξιά"
      ],
      correct: 1
    }
  ];

  // Map Quiz Data
  private map!: L.Map;
  private locations: MapLocation[] = [
    { 
      name: 'Wrong 1', 
      coords: [35.2509, 25.1499] as L.LatLngExpression, 
      correct: false 
    },
    {
      name: 'Correct Spot',
      coords: [35.3596, 25.0258] as L.LatLngExpression,
      correct: true,
      image: 'first-date.jpg',
      caption: 'Ποιος Πικάσο;'
    },
    { 
      name: 'Wrong 2', 
      coords: [35.3215, 25.1331] as L.LatLngExpression, 
      correct: false 
    },
    { 
      name: 'Wrong 3', 
      coords: [35.3169, 25.0966] as L.LatLngExpression, 
      correct: false 
    }
  ];

  // ============================================================================
  // SCREEN NAVIGATION
  // ============================================================================

  startGame() {
    this.currentScreen = 'game';
  }

  // ============================================================================
  // KEYBOARD INPUT HANDLER
  // ============================================================================

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.currentScreen !== 'game') return;

    const key = event.key.toLowerCase();
    
    // Prevent default scrolling behavior
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }

    // Calculate new position
    let newX = this.playerPos.x;
    let newY = this.playerPos.y;

    if (key === 'w' || key === 'arrowup') newY--;
    if (key === 's' || key === 'arrowdown') newY++;
    if (key === 'a' || key === 'arrowleft') newX--;
    if (key === 'd' || key === 'arrowright') newX++;

    // Check if new position is valid (not a wall)
    if (this.maze[newY] && this.maze[newY][newX] !== 0) {
      this.playerPos = { x: newX, y: newY };

      // Check for checkpoint collision
      const checkpoint = this.checkpoints.find(
        cp => cp.x === newX && cp.y === newY && !cp.completed
      );

      if (checkpoint) {
        this.openCheckpoint(checkpoint);
      }

      // Check for goal reached
      if (newX === this.goalPos.x && newY === this.goalPos.y) {
        this.checkWinCondition();
      }
    }
  }

  // GAME LOGIC
  openCheckpoint(checkpoint: Checkpoint) {
    this.currentCheckpoint = checkpoint;
    this.currentScreen = 'checkpoint';
    
    if (checkpoint.type === 'map-quiz') {
      this.initMap();
    }
  }

  completeCheckpoint() {
    if (this.currentCheckpoint) {
      this.currentCheckpoint.completed = true;
      this.currentCheckpoint = null;
      this.currentScreen = 'game';
      
      this.resetCheckpointData();
      setTimeout(() => {
        this.gameContainer?.nativeElement.focus();
      }, 10);
    }
  }

  resetCheckpointData() {
    this.birthdayAnswer = '';
    this.birthdayError = '';
    this.findItemError = '';
    this.timelineError = '';
    this.proverbsError = '';
    this.emojiError = '';
  }

  checkWinCondition() {
    const allCompleted = this.checkpoints.every(cp => cp.completed);
    if (allCompleted) {
      this.currentScreen = 'win';
    }
  }

  getCompletedCheckpointsCount(): number {
    return this.checkpoints.filter(cp => cp.completed).length;
  }

  isCheckpointCompleted(x: number, y: number): boolean {
    const checkpoint = this.checkpoints.find(cp => cp.x === x && cp.y === y);
    return checkpoint ? checkpoint.completed : false;
  }

  // PLAYER & GOAL POSITIONING
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

  // CHECKPOINT VALIDATION METHODS

  // Birthday Checkpoint
  checkBirthday() {
    if (this.birthdayAnswer === this.correctBirthday) {
      this.completeCheckpoint();
    } else {
      this.birthdayError = 'ΣΟΒΑΡΑ ΤΟ ΕΚΑΝΕΣ ΛΑΘΟΣ;;;';
    }
  }

  // Find Item Checkpoint
  checkFindItem(item: string) {
    if (item === this.targetItem) {
      this.completeCheckpoint();
    } else {
      this.findItemError = 'Όχι ακριβώς! Συνέχισε να ψάχνεις...';
    }
  }

  // Proverbs Checkpoint
  checkProverbs() {
    const a = this.proverbsAnswers;
    const errors: string[] = [];

    if (a.p1.toLowerCase().trim() !== 'κοκόρου') errors.push('1');
    if (a.p2.toLowerCase().trim() !== 'γιαννάκης') errors.push('2');
    if (a.p3.toLowerCase().trim() !== 'πίνει') errors.push('3');
    if (a.p4.toLowerCase().trim() !== 'βαφτίσαμε') errors.push('4');
    if (a.p5.toLowerCase().trim() !== 'μπορεί' && a.p5.toLowerCase().trim() !== 'πονεί') {
      errors.push('5');
    }
    if (a.p6.toLowerCase().trim() !== 'θεριό') errors.push('6');
    if (a.p7.toLowerCase().trim() !== 'προκοπή') errors.push('7');

    if (errors.length === 0) {
      this.completeCheckpoint();
    } else {
      this.proverbsError = this.formatProverbErrors(errors);
    }
  }

  private formatProverbErrors(errors: string[]): string {
    const baseMessage = 'Δες το βίντεο για βοήθεια...';
    
    if (errors.length === 1) {
      return `Η ${errors[0]} δεν είναι σωστή! ${baseMessage}`;
    } else if (errors.length === 2) {
      return `Οι ${errors.join(' και ')} δεν είναι σωστές! ${baseMessage}`;
    } else {
      const lastError = errors[errors.length - 1];
      const otherErrors = errors.slice(0, -1).join(', ');
      return `Οι ${otherErrors} και ${lastError} δεν είναι σωστές! ${baseMessage}`;
    }
  }

  // Timeline Checkpoint
  checkTimeline() {
    const o = this.timelineOrder;
    const correctOrder = 
      String(o.img1) === '2' &&
      String(o.img2) === '4' &&
      String(o.img3) === '1' &&
      String(o.img4) === '3' &&
      String(o.img5) === '6' &&
      String(o.img6) === '5';

    if (correctOrder) {
      this.completeCheckpoint();
    } else {
      this.timelineError = 'Χμμ, μάλλον οι αναμνήσεις σου είναι λίγο μπερδεμένες! Δοκίμασε ξανά.';
    }
  }

  // Emoji Checkpoint
  checkEmoji(selectedEmoji: string) {
    if (selectedEmoji === '😏') {
      this.completeCheckpoint();
    } else {
      this.emojiError = 'Όχι, αυτό το αντέχεις νομίζω...';
    }
  }

  // Multi-Quiz Checkpoint
  handleQuizAnswer(index: number) {
    const isCorrect = index === this.quizQuestions[this.currentQuestionIndex].correct;

    if (isCorrect) {
      if (this.currentQuestionIndex < this.quizQuestions.length - 1) {
        this.currentQuestionIndex++;
      } else {
        this.completeCheckpoint();
        this.currentQuestionIndex = 0;
      }
    } else {
      this.notify('Λάθος!', 'Ξαναπροσπάθησε από την αρχή...', 'error');
      this.currentQuestionIndex = 0;
    }
  }

  // MAP QUIZ
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

        marker.on('popupopen', () => {
          const btn = document.getElementById('finish-map-btn');
          if (btn) {
            btn.onclick = () => this.completeCheckpoint();
          }
        });

        marker.on('click', () => {
          if (loc.correct) {
            this.showCorrectLocationPopup(marker, loc);
          } else {
            this.notify('Λάθος τοποθεσία!', 'Όχι εδώ! Ψάξε ξανά...', 'error');
          }
        });
      });
    }, 100);
  }

  private showCorrectLocationPopup(marker: L.Marker, location: MapLocation) {
    const popupContent = `
      <div style="text-align: center; font-family: sans-serif;">
        <img src="${location.image}" style="width: 200px; border-radius: 10px; margin-bottom: 8px;">
        <p style="font-weight: bold; color: #ff4d6d;">${location.caption}</p>
        <button id="finish-map-btn" style="background: #ff4d6d; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
          Συνέχισε το παιχνίδι!
        </button>
      </div>
    `;

    marker.unbindPopup();
    marker.bindPopup(popupContent).openPopup();
  }

  // NOTIFICATION SYSTEM
  notify(title: string, message: string, type: 'success' | 'error' = 'success') {
    this.notificationTitle = title;
    this.notificationMessage = message;
    this.notificationType = type;
    this.showNotification = true;
  }

  closeNotification() {
    this.showNotification = false;
  }

  // INTRO SCREEN - NO BUTTON
  moveNoButton() {
    const randomLeft = Math.random() * 80 + 10;
    const randomTop = Math.random() * 80 + 10;

    this.noButtonStyle = {
      position: 'fixed',
      left: `${randomLeft}%`,
      top: `${randomTop}%`,
      transform: 'translate(-50%, -50%)'
    };
  }

  // WIN SCREEN - LETTER ANIMATION
  openEnvelope() {
    this.envelopeOpened = true;
    setTimeout(() => {
      this.letterVisible = true;
    }, 600);
  }
}