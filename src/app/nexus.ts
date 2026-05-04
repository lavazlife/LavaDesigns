import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface NexusItem {
  id: string;
  type: 'prompt' | 'app' | 'project' | 'asset' | 'note';
  title: string;
  content: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NexusService {
  private STORAGE_KEY = 'lava_nexus_v2';
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private http = inject(HttpClient);

  items = signal<NexusItem[]>([]);
  
  constructor() {
    if (this.isBrowser) {
      this.load();
      effect(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.items()));
      });
    }
  }

  private load() {
    if (!this.isBrowser) return;
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        this.items.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse storage', e);
      }
    }
  }

  addItem(item: Omit<NexusItem, 'id' | 'createdAt' | 'updatedAt'>) {
    const newItem: NexusItem = {
      ...item,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.items.update(items => [newItem, ...items]);
    return newItem;
  }

  updateItem(id: string, updates: Partial<NexusItem>) {
    this.items.update(items => items.map(item => 
      item.id === id ? { ...item, ...updates, updatedAt: Date.now() } : item
    ));
  }

  deleteItem(id: string) {
    this.items.update(items => items.filter(item => item.id !== id));
  }

  async forgeContent(prompt: string, context?: string) {
    try {
      const response = await firstValueFrom(
        this.http.post<{ text: string }>('/api/forge', { prompt, context })
      );
      return response.text;
    } catch (e) {
      console.error('Forge error', e);
      return 'Error: Failed to connect to Nexus Forge.';
    }
  }
}
