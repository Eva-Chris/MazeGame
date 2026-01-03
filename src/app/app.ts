// app.component.ts
import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Position {
  x: number;
  y: number;
}

interface Checkpoint {
  x: number;
  y: number;
  type: 'birthday' | 'find-item' | 'song' | 'proverbs' | 'timeline' | 'emoji-quiz';
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
  currentScreen: 'intro' | 'game' | 'checkpoint' | 'win' = 'intro';
  
  // No button escape logic (starts next to Yes button)
  noButtonStyle: { position: string; left: string; top: string; transform?: string } = { position: 'relative', left: '0px', top: '0px' };
  noButtonClicked = false;
    
  // Game state
  playerPos: Position = { x: 1, y: 1 };
  goalPos: Position = { x: 18, y: 13 };
  cellSize = 60; // Cell size for maze
  
  maze = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0], // x:4, y:1 (proverbs)
    [0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1,0],
    [0,1,0,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,0],
    [0,1,0,1,0,0,0,1,0,0,0,0,0,1,0,1,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,0], // x:10, y:5 (find-item)
    [0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,2,0], // x:18, y:6 (timeline)
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,0], // x:8, y:9 (song)
    [0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,0],
    [0,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,1,0], // x:1, y:13 (emoji) & x:16, y:13 (birthday)
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
  ];

  checkpoints: Checkpoint[] = [
    { x: 10, y: 5, type: 'find-item', completed: false },
    { x: 8, y: 9, type: 'song', completed: false },
    { x: 16, y: 13, type: 'birthday', completed: false },
    { x: 4, y: 1, type: 'proverbs', completed: false },
    { x: 18, y: 6, type: 'timeline', completed: false },
    { x: 1, y: 13, type: 'emoji-quiz', completed: false }
  ];
  
  currentCheckpoint: Checkpoint | null = null;
  
  // Checkpoint answers
  birthdayAnswer = '';
  birthdayError = '';
  correctBirthday = '2001-04-27';
  
  // Find item checkpoint
  findItems = ['🎮', '📱', '⌚', '🎧', '👓', '💻', '🎹', '📷', 
                '⚽', '🎸', '📚', '☕', '🍕', '🎬', '🎨', '🔑'];
  targetItem = '👓';
  findItemError = '';
  
  // Song checkpoint
  songAnswer = '';
  songError = '';
  correctSong = 'your song title';

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

  checkSong() {
    if (this.songAnswer.toLowerCase().includes(this.correctSong.toLowerCase())) {
      this.completeCheckpoint();
    } else {
      this.songError = 'Χμμ, όχι αυτό που σκέφτομαι! 🎵';
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
      this.birthdayAnswer = '';
      this.birthdayError = '';
      this.songAnswer = '';
      this.songError = '';
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
}