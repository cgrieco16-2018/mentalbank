import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Contract,
  ValueEvent,
  DayHappenings,
  UserProfile,
  AppSettings,
  Affirmation,
  DailyAffirmations,
  RealityIncome,
  ValueEventDefinition,
} from "./types";

const KEYS = {
  CONTRACT: "@mental_bank_contract",
  VALUE_EVENTS: "@mental_bank_value_events",
  VALUE_EVENT_DEFINITIONS: "@mental_bank_value_event_definitions",
  HAPPENINGS: "@mental_bank_happenings",
  PROFILE: "@mental_bank_profile",
  SETTINGS: "@mental_bank_settings",
  AFFIRMATIONS: "@mental_bank_affirmations",
  DAILY_AFFIRMATIONS: "@mental_bank_daily_affirmations",
  REALITY_INCOME: "@mental_bank_reality_income",
};

export const storage = {
  async saveContract(contract: Contract): Promise<void> {
    await AsyncStorage.setItem(KEYS.CONTRACT, JSON.stringify(contract));
  },

  async getContract(): Promise<Contract | null> {
    const data = await AsyncStorage.getItem(KEYS.CONTRACT);
    return data ? JSON.parse(data) : null;
  },

  async saveValueEvent(event: ValueEvent): Promise<void> {
    const events = await this.getAllValueEvents();
    const existingIndex = events.findIndex((e) => e.id === event.id);

    if (existingIndex >= 0) {
      events[existingIndex] = event;
    } else {
      events.push(event);
    }

    await AsyncStorage.setItem(KEYS.VALUE_EVENTS, JSON.stringify(events));
  },

  async deleteValueEvent(eventId: string): Promise<void> {
    const events = await this.getAllValueEvents();
    const filtered = events.filter((e) => e.id !== eventId);
    await AsyncStorage.setItem(KEYS.VALUE_EVENTS, JSON.stringify(filtered));
  },

  async getAllValueEvents(): Promise<ValueEvent[]> {
    const data = await AsyncStorage.getItem(KEYS.VALUE_EVENTS);
    return data ? JSON.parse(data) : [];
  },

  async getValueEventsByDate(date: string): Promise<ValueEvent[]> {
    const allEvents = await this.getAllValueEvents();
    return allEvents.filter((e) => e.date === date);
  },

  async saveDayHappenings(happenings: DayHappenings): Promise<void> {
    const allHappenings = await this.getAllHappenings();
    const existingIndex = allHappenings.findIndex(
      (h) => h.date === happenings.date
    );

    if (existingIndex >= 0) {
      allHappenings[existingIndex] = happenings;
    } else {
      allHappenings.push(happenings);
    }

    await AsyncStorage.setItem(KEYS.HAPPENINGS, JSON.stringify(allHappenings));
  },

  async getAllHappenings(): Promise<DayHappenings[]> {
    const data = await AsyncStorage.getItem(KEYS.HAPPENINGS);
    return data ? JSON.parse(data) : [];
  },

  async getHappeningsByDate(date: string): Promise<DayHappenings | null> {
    const allHappenings = await this.getAllHappenings();
    return allHappenings.find((h) => h.date === date) || null;
  },

  async saveProfile(profile: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  async getProfile(): Promise<UserProfile | null> {
    const data = await AsyncStorage.getItem(KEYS.PROFILE);
    return data ? JSON.parse(data) : null;
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  async getSettings(): Promise<AppSettings | null> {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : null;
  },

  async clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
      KEYS.CONTRACT,
      KEYS.VALUE_EVENTS,
      KEYS.HAPPENINGS,
      KEYS.REALITY_INCOME,
    ]);
  },

  async saveAffirmation(affirmation: Affirmation): Promise<void> {
    const affirmations = await this.getAllAffirmations();
    const existingIndex = affirmations.findIndex((a) => a.id === affirmation.id);

    if (existingIndex >= 0) {
      affirmations[existingIndex] = affirmation;
    } else {
      affirmations.push(affirmation);
    }

    await AsyncStorage.setItem(KEYS.AFFIRMATIONS, JSON.stringify(affirmations));
  },

  async deleteAffirmation(affirmationId: string): Promise<void> {
    const affirmations = await this.getAllAffirmations();
    const filtered = affirmations.filter((a) => a.id !== affirmationId);
    await AsyncStorage.setItem(KEYS.AFFIRMATIONS, JSON.stringify(filtered));
  },

  async getAllAffirmations(): Promise<Affirmation[]> {
    const data = await AsyncStorage.getItem(KEYS.AFFIRMATIONS);
    return data ? JSON.parse(data) : [];
  },

  async incrementAffirmationUsage(affirmationId: string): Promise<void> {
    const affirmations = await this.getAllAffirmations();
    const affirmation = affirmations.find((a) => a.id === affirmationId);
    if (affirmation) {
      affirmation.usageCount += 1;
      await this.saveAffirmation(affirmation);
    }
  },

  async saveDailyAffirmations(daily: DailyAffirmations): Promise<void> {
    const allDaily = await this.getAllDailyAffirmations();
    const existingIndex = allDaily.findIndex((d) => d.date === daily.date);

    if (existingIndex >= 0) {
      allDaily[existingIndex] = daily;
    } else {
      allDaily.push(daily);
    }

    await AsyncStorage.setItem(KEYS.DAILY_AFFIRMATIONS, JSON.stringify(allDaily));
  },

  async getAllDailyAffirmations(): Promise<DailyAffirmations[]> {
    const data = await AsyncStorage.getItem(KEYS.DAILY_AFFIRMATIONS);
    return data ? JSON.parse(data) : [];
  },

  async getDailyAffirmationsByDate(date: string): Promise<DailyAffirmations | null> {
    const allDaily = await this.getAllDailyAffirmations();
    return allDaily.find((d) => d.date === date) || null;
  },

  async saveRealityIncome(income: RealityIncome): Promise<void> {
    const incomes = await this.getAllRealityIncomes();
    const existingIndex = incomes.findIndex((i) => i.id === income.id);

    if (existingIndex >= 0) {
      incomes[existingIndex] = income;
    } else {
      incomes.push(income);
    }

    await AsyncStorage.setItem(KEYS.REALITY_INCOME, JSON.stringify(incomes));
  },

  async deleteRealityIncome(incomeId: string): Promise<void> {
    const incomes = await this.getAllRealityIncomes();
    const filtered = incomes.filter((i) => i.id !== incomeId);
    await AsyncStorage.setItem(KEYS.REALITY_INCOME, JSON.stringify(filtered));
  },

  async getAllRealityIncomes(): Promise<RealityIncome[]> {
    const data = await AsyncStorage.getItem(KEYS.REALITY_INCOME);
    return data ? JSON.parse(data) : [];
  },

  async getRealityIncomesByDate(date: string): Promise<RealityIncome[]> {
    const allIncomes = await this.getAllRealityIncomes();
    return allIncomes.filter((i) => i.date === date);
  },

  async saveValueEventDefinition(definition: ValueEventDefinition): Promise<void> {
    const definitions = await this.getAllValueEventDefinitions();
    const existingIndex = definitions.findIndex((d) => d.id === definition.id);

    if (existingIndex >= 0) {
      definitions[existingIndex] = definition;
    } else {
      definitions.push(definition);
    }

    await AsyncStorage.setItem(KEYS.VALUE_EVENT_DEFINITIONS, JSON.stringify(definitions));
  },

  async deleteValueEventDefinition(definitionId: string): Promise<void> {
    const definitions = await this.getAllValueEventDefinitions();
    const filtered = definitions.filter((d) => d.id !== definitionId);
    await AsyncStorage.setItem(KEYS.VALUE_EVENT_DEFINITIONS, JSON.stringify(filtered));
  },

  async getAllValueEventDefinitions(): Promise<ValueEventDefinition[]> {
    const data = await AsyncStorage.getItem(KEYS.VALUE_EVENT_DEFINITIONS);
    return data ? JSON.parse(data) : [];
  },

  async getActiveValueEventDefinitions(): Promise<ValueEventDefinition[]> {
    const all = await this.getAllValueEventDefinitions();
    return all.filter((d) => d.isActive);
  },

  async incrementDefinitionUsage(definitionId: string): Promise<void> {
    const definitions = await this.getAllValueEventDefinitions();
    const definition = definitions.find((d) => d.id === definitionId);
    if (definition) {
      definition.usageCount += 1;
      await this.saveValueEventDefinition(definition);
    }
  },

  async exportAllData(): Promise<string> {
    const [
      contract,
      valueEvents,
      valueEventDefinitions,
      happenings,
      profile,
      settings,
      affirmations,
      dailyAffirmations,
      realityIncomes,
    ] = await Promise.all([
      this.getContract(),
      this.getAllValueEvents(),
      this.getAllValueEventDefinitions(),
      this.getAllHappenings(),
      this.getProfile(),
      this.getSettings(),
      this.getAllAffirmations(),
      this.getAllDailyAffirmations(),
      this.getAllRealityIncomes(),
    ]);

    const exportData = {
      version: 2,
      exportedAt: new Date().toISOString(),
      data: {
        contract,
        valueEvents,
        valueEventDefinitions,
        happenings,
        profile,
        settings,
        affirmations,
        dailyAffirmations,
        realityIncomes,
      },
    };

    return JSON.stringify(exportData, null, 2);
  },

  async importAllData(jsonString: string): Promise<{ 
    success: boolean; 
    error?: string;
    details?: {
      backupDate: string;
      valueEventsCount: number;
      realityIncomesCount: number;
      affirmationsCount: number;
      valueEventDefinitionsCount: number;
      hasContract: boolean;
      hasProfile: boolean;
    };
  }> {
    try {
      const importData = JSON.parse(jsonString);

      if (!importData.version || !importData.data) {
        return { success: false, error: "Invalid backup file format" };
      }

      const { data } = importData;
      const backupDate = importData.exportedAt || "Unknown";

      await AsyncStorage.multiRemove(Object.values(KEYS));

      const keyValuePairs: [string, string][] = [];

      if (data.contract) {
        keyValuePairs.push([KEYS.CONTRACT, JSON.stringify(data.contract)]);
      }

      if (data.valueEvents) {
        keyValuePairs.push([KEYS.VALUE_EVENTS, JSON.stringify(data.valueEvents)]);
      }

      if (data.happenings) {
        keyValuePairs.push([KEYS.HAPPENINGS, JSON.stringify(data.happenings)]);
      }

      if (data.profile) {
        keyValuePairs.push([KEYS.PROFILE, JSON.stringify(data.profile)]);
      }

      if (data.settings) {
        keyValuePairs.push([KEYS.SETTINGS, JSON.stringify(data.settings)]);
      }

      if (data.affirmations) {
        keyValuePairs.push([KEYS.AFFIRMATIONS, JSON.stringify(data.affirmations)]);
      }

      if (data.dailyAffirmations) {
        keyValuePairs.push([KEYS.DAILY_AFFIRMATIONS, JSON.stringify(data.dailyAffirmations)]);
      }

      if (data.realityIncomes) {
        keyValuePairs.push([KEYS.REALITY_INCOME, JSON.stringify(data.realityIncomes)]);
      }

      if (data.valueEventDefinitions) {
        keyValuePairs.push([KEYS.VALUE_EVENT_DEFINITIONS, JSON.stringify(data.valueEventDefinitions)]);
      }

      await AsyncStorage.multiSet(keyValuePairs);

      return { 
        success: true,
        details: {
          backupDate,
          valueEventsCount: Array.isArray(data.valueEvents) ? data.valueEvents.length : 0,
          realityIncomesCount: Array.isArray(data.realityIncomes) ? data.realityIncomes.length : 0,
          affirmationsCount: Array.isArray(data.affirmations) ? data.affirmations.length : 0,
          valueEventDefinitionsCount: Array.isArray(data.valueEventDefinitions) ? data.valueEventDefinitions.length : 0,
          hasContract: !!data.contract,
          hasProfile: !!data.profile,
        }
      };
    } catch (error) {
      return { success: false, error: "Failed to parse backup file" };
    }
  },
};
