import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  USER: '@trakya_user',
  COURSES: '@trakya_courses',
  SAVED_DEALS: '@trakya_saved_deals',
  REMEMBER_ME: '@trakya_remember_me', // "Beni Unutma" için kullanıcı adı
  COMMUNITY_MEMBERSHIPS: '@trakya_community_memberships', // Topluluk katılımları {eventId: {fullName, department, joinedAt}}
  COMMUNITY_CHAT: '@trakya_community_chat', // Topluluk sohbet mesajları {eventId: [{id, sender, text, time, isOwn}]}
  COMMUNITY_OVERRIDES: '@trakya_community_overrides', // Admin konum düzenlemeleri {eventId: {location, date, time}}
  THEME_MODE: '@trakya_theme_mode', // 'light' | 'dark'
};

export const storageService = {
  // Kullanıcı oturumu
  async getUser() {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setUser(user) {
    try {
      await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
    } catch (e) {
      console.warn('User kaydedilemedi:', e);
    }
  },

  async removeUser() {
    try {
      await AsyncStorage.removeItem(KEYS.USER);
    } catch (e) {
      console.warn('User silinemedi:', e);
    }
  },

  // "Beni Unutma" - Kullanıcı adı hatırlama
  async getRememberedUsername() {
    try {
      return await AsyncStorage.getItem(KEYS.REMEMBER_ME);
    } catch {
      return null;
    }
  },

  async setRememberedUsername(username) {
    try {
      await AsyncStorage.setItem(KEYS.REMEMBER_ME, username);
    } catch (e) {
      console.warn('Remembered username kaydedilemedi:', e);
    }
  },

  async removeRememberedUsername() {
    try {
      await AsyncStorage.removeItem(KEYS.REMEMBER_ME);
    } catch (e) {
      console.warn('Remembered username silinemedi:', e);
    }
  },

  // Dersler
  async getCourses() {
    try {
      const data = await AsyncStorage.getItem(KEYS.COURSES);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveCourses(courses) {
    try {
      await AsyncStorage.setItem(KEYS.COURSES, JSON.stringify(courses));
    } catch (e) {
      console.warn('Courses kaydedilemedi:', e);
    }
  },

  // Kaydedilen Kampanyalar
  async getSavedDeals() {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_DEALS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async toggleSavedDeal(dealId) {
    try {
      const current = await this.getSavedDeals();
      const updated = current.includes(dealId)
        ? current.filter((id) => id !== dealId)
        : [...current, dealId];
      await AsyncStorage.setItem(KEYS.SAVED_DEALS, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  // Topluluk katılımları
  async getCommunityMemberships() {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_MEMBERSHIPS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async getCommunityMembership(eventId) {
    try {
      const all = await this.getCommunityMemberships();
      return all[eventId] || null;
    } catch {
      return null;
    }
  },

  async saveCommunityMembership(eventId, { fullName, department }) {
    try {
      const all = await this.getCommunityMemberships();
      all[eventId] = {
        fullName,
        department,
        joinedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(KEYS.COMMUNITY_MEMBERSHIPS, JSON.stringify(all));
      return all[eventId];
    } catch (e) {
      console.warn('Topluluk üyeliği kaydedilemedi:', e);
      return null;
    }
  },

  async removeCommunityMembership(eventId) {
    try {
      const all = await this.getCommunityMemberships();
      delete all[eventId];
      await AsyncStorage.setItem(KEYS.COMMUNITY_MEMBERSHIPS, JSON.stringify(all));
      return true;
    } catch (e) {
      console.warn('Topluluk üyeliği silinemedi:', e);
      return false;
    }
  },

  // Topluluk sohbet mesajları (kullanıcının gönderdikleri)
  async getCommunityChatMessages(eventId) {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_CHAT);
      const all = data ? JSON.parse(data) : {};
      return all[eventId] || [];
    } catch {
      return [];
    }
  },

  async appendCommunityChatMessage(eventId, message) {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_CHAT);
      const all = data ? JSON.parse(data) : {};
      const list = all[eventId] || [];
      list.push(message);
      all[eventId] = list;
      await AsyncStorage.setItem(KEYS.COMMUNITY_CHAT, JSON.stringify(all));
      return list;
    } catch (e) {
      console.warn('Sohbet mesajı kaydedilemedi:', e);
      return null;
    }
  },

  // Admin buluşma konumu düzenlemeleri (topluluk detay override)
  async getCommunityOverrides() {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_OVERRIDES);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  async saveCommunityOverride(eventId, { location, date, time }) {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMUNITY_OVERRIDES);
      const all = data ? JSON.parse(data) : {};
      all[eventId] = {
        location,
        date,
        time,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(KEYS.COMMUNITY_OVERRIDES, JSON.stringify(all));
      return all[eventId];
    } catch (e) {
      console.warn('Konum düzenlemesi kaydedilemedi:', e);
      return null;
    }
  },

  // Tema tercihi (Dark Mode)
  async getThemeMode() {
    try {
      return await AsyncStorage.getItem(KEYS.THEME_MODE);
    } catch {
      return null;
    }
  },

  async setThemeMode(mode) {
    try {
      await AsyncStorage.setItem(KEYS.THEME_MODE, mode);
    } catch (e) {
      console.warn('Tema tercihi kaydedilemedi:', e);
    }
  },
};
