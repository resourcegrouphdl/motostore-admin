import { Injectable, inject, signal, computed } from '@angular/core';
import {
  Auth, User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from '@angular/fire/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);

  /** Usuario de Firebase actualmente autenticado (null = sin sesión). */
  readonly currentUser = signal<User | null>(null);

  /** true cuando hay sesión activa. */
  readonly isLoggedIn = computed(() => !!this.currentUser());

  constructor() {
    // Sincroniza el signal con el estado real de Firebase Auth
    onAuthStateChanged(this.auth, user => this.currentUser.set(user));
  }

  signIn(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  signOut() {
    return signOut(this.auth);
  }

  sendPasswordReset(email: string) {
    return sendPasswordResetEmail(this.auth, email);
  }
}
