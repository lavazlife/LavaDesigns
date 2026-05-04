import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NexusService, NexusItem } from './nexus';
import { animate, stagger } from "motion";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  host: {
    'class': 'block min-h-screen overflow-x-hidden'
  }
})
export class App {
  nexus = inject(NexusService);
  
  activeView = signal<'home' | 'notes' | 'forge' | 'architect' | 'board' | 'vault' | 'console'>('home');
  searchQuery = signal('');
  
  // State for forms
  itemToEdit = signal<NexusItem | null>(null);
  showSheet = signal<string | null>(null);

  // Forge state
  isForging = signal(false);
  forgeResult = signal<string | null>(null);

  // Stats
  activeProjectsCount = computed(() => this.nexus.items().filter(i => i.type === 'project' && i.metadata?.['status'] === 'active').length);
  promptsCount = computed(() => this.nexus.items().filter(i => i.type === 'prompt').length);
  notesCount = computed(() => this.nexus.items().filter(i => i.type === 'note').length);

  // Filtered lists
  filteredNotes = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.nexus.items()
      .filter(i => i.type === 'note')
      .filter(i => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q))
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  });

  // Recent activity
  recentActivity = computed(() => 
    [...this.nexus.items()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5)
  );

  constructor() {
    // Entrance animation
    setTimeout(() => {
      const cards = document.querySelectorAll('.lava-card');
      if (cards.length) {
        animate(cards, { opacity: [0, 1], y: [20, 0] }, { delay: stagger(0.05), duration: 0.6 });
      }
    }, 100);
  }

  setView(view: 'home' | 'notes' | 'forge' | 'architect' | 'board' | 'vault' | 'console') {
    this.activeView.set(view);
    this.searchQuery.set('');
  }

  openSheet(name: string) {
    this.showSheet.set(name);
  }

  closeSheets() {
    this.showSheet.set(null);
    this.itemToEdit.set(null);
  }

  // --- ACTIONS ---
  handleQuickCapture(text: string) {
    if (!text.trim()) return;
    this.nexus.addItem({
      type: 'asset',
      title: 'Quick Capture',
      content: text
    });
    this.showToast('Logged to Vault 🌋');
  }

  showToast(msg: string) {
    // Simple toast simulation
    console.log('Toast:', msg);
  }

  // --- ANDROID PROJECT GENERATOR ---
  generateAndroidProject() {
    const androidFiles = [
      {
        path: 'settings.gradle',
        content: `include ':app'`
      },
      {
        path: 'build.gradle',
        content: `buildscript { 
  repositories { google(); mavenCentral() } 
  dependencies { classpath 'com.android.tools.build:gradle:8.1.0' } 
}`
      },
      {
        path: 'app/build.gradle',
        content: `apply plugin: 'com.android.application'
android { 
  compileSdkVersion 34; 
  namespace "com.com.lavazlife.app"; 
  defaultConfig { 
    applicationId "com.lavazlife.app"; 
    minSdkVersion 24; 
    targetSdkVersion 34; 
    versionCode 1; 
    versionName "1.0" 
  } 
}`
      },
      {
        path: 'app/src/main/java/com/lavazlife/app/MainActivity.java',
        content: `package com.lavazlife.app;
import android.app.Activity;
import android.os.Bundle;
import android.widget.TextView;
public class MainActivity extends Activity {
    @Override protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        TextView text = new TextView(this); 
        text.setText("LavaDesigns Built!"); 
        setContentView(text);
    }
}`
      },
      {
        path: 'app/src/main/AndroidManifest.xml',
        content: `<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  <application>
    <activity android:name=".MainActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>`
      },
      {
        path: '.github/workflows/build.yml',
        content: `name: Build APK
on: workflow_dispatch
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-java@v4
      with: { distribution: 'zulu', java-version: '17' }
    - run: gradle assembleDebug
    - uses: actions/upload-artifact@v4
      with: { name: app-debug, path: app/build/outputs/apk/debug/app-debug.apk }`
      }
    ];

    // Save this as a multi-part asset
    this.nexus.addItem({
      type: 'app',
      title: 'LavaDesigns Android Project',
      content: JSON.stringify(androidFiles),
      metadata: { platform: 'android', flavor: 'lava' }
    });
    this.showToast('Android Project Architected 📱');
  }

  async forgeIntelligence(prompt: string) {
    if (!prompt.trim()) return;
    this.isForging.set(true);
    this.forgeResult.set(null);
    
    try {
      const result = await this.nexus.forgeContent(prompt);
      this.forgeResult.set(result);
    } catch {
      this.showToast('Forge failed 🌩️');
    } finally {
      this.isForging.set(false);
    }
  }

  saveForgeResult() {
    const result = this.forgeResult();
    if (!result) return;
    
    this.nexus.addItem({
      type: 'note',
      title: 'Forged Knowledge ' + new Date().toLocaleTimeString(),
      content: result
    });
    this.showToast('Intelligence Stored 🏛️');
    this.forgeResult.set(null);
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('Copied to Clipboard 📋');
    });
  }
}
