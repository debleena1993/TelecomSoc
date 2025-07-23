import { threatAnalysisService, type CDRRecord, type SMSRecord } from './threatAnalysis';

export class MockDataGenerator {
  private isRunning = false;
  private interval: NodeJS.Timeout | null = null;

  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Starting mock data generation for telecom cybersecurity system...');
    
    // Generate initial batch of data
    this.generateInitialData();
    
    // Start continuous data generation (reduced frequency to avoid API quota)
    this.interval = setInterval(() => {
      this.generateRealtimeData();
    }, 30000); // Generate new data every 30 seconds
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('Stopped mock data generation');
  }

  private generateInitialData() {
    // Generate reduced initial data to avoid API quota issues
    for (let i = 0; i < 3; i++) {
      const cdr = this.generateMockCDR();
      threatAnalysisService.analyzeCDRRecord(cdr);
    }

    for (let i = 0; i < 2; i++) {
      const sms = this.generateMockSMS();
      threatAnalysisService.analyzeSMSRecord(sms);
    }
  }

  private generateRealtimeData() {
    // Generate 1 new record to avoid API quota issues
    if (Math.random() < 0.5) {
      const cdr = this.generateMockCDR();
      threatAnalysisService.analyzeCDRRecord(cdr);
    } else {
      const sms = this.generateMockSMS();
      threatAnalysisService.analyzeSMSRecord(sms);
    }
  }

  private generateMockCDR(): CDRRecord {
    const isAnomalous = Math.random() < 0.15; // 15% chance of anomalous call
    
    return {
      callId: `cdr_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      fromNumber: this.generatePhoneNumber(isAnomalous),
      toNumber: this.generatePhoneNumber(false),
      duration: isAnomalous ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * 300) + 30,
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)), // Within last hour
      callType: Math.random() < 0.8 ? 'voice' : 'sms',
      location: this.generateLocation(),
      imei: this.generateIMEI(),
    };
  }

  private generateMockSMS(): SMSRecord {
    const isPhishing = Math.random() < 0.1; // 10% chance of phishing SMS
    
    return {
      messageId: `sms_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
      fromNumber: this.generatePhoneNumber(isPhishing),
      toNumber: this.generatePhoneNumber(false),
      message: isPhishing ? this.generatePhishingMessage() : this.generateNormalMessage(),
      timestamp: new Date(Date.now() - Math.floor(Math.random() * 3600000)), // Within last hour
      messageType: 'text',
    };
  }

  private generateMockUserActivity(): any[] {
    const activitiesCount = Math.floor(Math.random() * 10) + 5;
    const activities = [];
    
    for (let i = 0; i < activitiesCount; i++) {
      activities.push({
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 86400000)), // Within last day
        action: this.getRandomElement(['login', 'call', 'sms', 'data_usage', 'location_change']),
        location: this.generateLocation(),
        device: this.generateIMEI(),
        suspicious: Math.random() < 0.2, // 20% chance of suspicious activity
      });
    }
    
    return activities;
  }

  private generatePhoneNumber(suspicious = false): string {
    if (suspicious) {
      // Generate known suspicious number patterns
      const suspiciousPatterns = [
        '+1-800-',
        '+1-888-',
        '+44-20-',
        '+91-',
      ];
      const pattern = this.getRandomElement(suspiciousPatterns);
      return pattern + Math.floor(Math.random() * 9000000) + 1000000;
    }
    
    return `+1-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`;
  }

  private generateLocation(): string {
    const locations = [
      'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
      'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
      'Dallas, TX', 'San Jose, CA', 'London, UK', 'Mumbai, India',
      'Unknown', 'Beijing, China', 'Tokyo, Japan'
    ];
    return this.getRandomElement(locations);
  }

  private generateIMEI(): string {
    return Array.from({ length: 15 }, () => Math.floor(Math.random() * 10)).join('');
  }

  private generatePhishingMessage(): string {
    const phishingMessages = [
      'URGENT: Your account has been compromised. Click here to secure: http://suspicious-link.com',
      'Congratulations! You\'ve won $1000. Claim now: http://fake-winner.com',
      'Bank Alert: Suspicious activity detected. Verify your account: http://fake-bank.com',
      'Your package delivery failed. Update address: http://fake-delivery.com',
      'Security Alert: Login from new device. If not you, click: http://fake-security.com',
      'Tax refund available. Claim $500 now: http://fake-irs.com',
      'Your subscription will expire. Renew now: http://fake-subscription.com'
    ];
    return this.getRandomElement(phishingMessages);
  }

  private generateNormalMessage(): string {
    const normalMessages = [
      'Hey, are you free for lunch tomorrow?',
      'Meeting at 3 PM in conference room B',
      'Don\'t forget to pick up groceries',
      'Happy birthday! Hope you have a great day',
      'The project deadline is next Friday',
      'Thanks for your help with the presentation',
      'See you at the gym tonight',
      'Flight delayed by 2 hours',
      'Weather looks good for the weekend'
    ];
    return this.getRandomElement(normalMessages);
  }

  private getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}

export const mockDataGenerator = new MockDataGenerator();
