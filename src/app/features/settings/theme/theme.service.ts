import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ThemeConfig } from './theme.model';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private http = inject(HttpClient);

  getTheme(): Observable<ThemeConfig> {
    return this.http.get<ThemeConfig>('/api/v1/theme');
  }

  updateTheme(config: ThemeConfig): Observable<ThemeConfig> {
    return this.http.put<ThemeConfig>('/api/v1/theme', config);
  }
}
