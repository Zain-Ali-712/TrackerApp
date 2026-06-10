import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomChart } from '../../components/CustomChart';
import { Send, Plus, Filter, Calendar, Award, Globe, Mail, ChevronDown, Check, Users } from 'lucide-react-native';
import { OutreachEntry } from '../../types';

export const OutreachScreen: React.FC = () => {
  const {
    selectedDate,
    outreachEntries,
    outreachCategories,
    addOutreach,
    addCategory,
  } = useAppStore();

  // Primary category assigned to today
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Custom category text input
  const [customCatInput, setCustomCatInput] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  // New entry form states
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [instaHandle, setInstaHandle] = useState('');
  const [fbLink, setFbLink] = useState('');
  const [linkedinLink, setLinkedinLink] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');

  // Active platforms checkboxes
  const [activePlatforms, setActivePlatforms] = useState({
    email: false,
    instagram: false,
    linkedin: false,
    facebook: false,
    twitter: false,
  });

  // History filtering states
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Set default category on load
  useEffect(() => {
    if (outreachCategories.length > 0 && !selectedCategory) {
      setSelectedCategory(outreachCategories[0]);
    }
  }, [outreachCategories]);

  // Determine current day's primary category if entries already exist
  useEffect(() => {
    const todayEntries = outreachEntries.filter(e => e.date === selectedDate);
    if (todayEntries.length > 0) {
      setSelectedCategory(todayEntries[0].category);
    }
  }, [selectedDate, outreachEntries]);

  const handleAddCategory = () => {
    if (!customCatInput.trim()) return;
    addCategory(customCatInput.trim());
    setSelectedCategory(customCatInput.trim());
    setCustomCatInput('');
    setShowAddCat(false);
  };

  const handleLogOutreach = () => {
    if (!businessName.trim()) {
      Alert.alert('Required Info', 'Business Title is required to save an entry.');
      return;
    }

    addOutreach({
      category: selectedCategory,
      business_name: businessName.trim(),
      website: website.trim() || undefined,
      email: activePlatforms.email ? email.trim() || undefined : undefined,
      instagram: activePlatforms.instagram ? instaHandle.trim() || undefined : undefined,
      linkedin: activePlatforms.linkedin ? linkedinLink.trim() || undefined : undefined,
      facebook: activePlatforms.facebook ? fbLink.trim() || undefined : undefined,
      twitter: activePlatforms.twitter ? twitterHandle.trim() || undefined : undefined,
    });

    // Reset Form
    setBusinessName('');
    setWebsite('');
    setEmail('');
    setInstaHandle('');
    setFbLink('');
    setLinkedinLink('');
    setTwitterHandle('');
    setActivePlatforms({
      email: false,
      instagram: false,
      linkedin: false,
      facebook: false,
      twitter: false,
    });

    Alert.alert('Success', 'Outreach pitch logged successfully!');
  };

  // PLATFORM FIELD RENDER TOGGLE HELPER
  const togglePlatformCheckbox = (platform: keyof typeof activePlatforms) => {
    setActivePlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  // CALCULATE CRM STATISTICS
  const getStatistics = () => {
    const today = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(today.getDate() - 7);
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(today.getDate() - 30);

    const format = (d: Date) => d.toISOString().split('T')[0];

    const weeklyEntries = outreachEntries.filter(e => e.date >= format(oneWeekAgo));
    const monthlyEntries = outreachEntries.filter(e => e.date >= format(oneMonthAgo));

    // Best Platform & Most Used Category
    const platformCounts: Record<string, number> = { Email: 0, Instagram: 0, LinkedIn: 0, Facebook: 0, Twitter: 0 };
    const categoryCounts: Record<string, number> = {};

    outreachEntries.forEach(e => {
      // Category count
      categoryCounts[e.category] = (categoryCounts[e.category] || 0) + 1;
      
      // Platform counts
      if (e.email) platformCounts.Email++;
      if (e.instagram) platformCounts.Instagram++;
      if (e.linkedin) platformCounts.LinkedIn++;
      if (e.facebook) platformCounts.Facebook++;
      if (e.twitter) platformCounts.Twitter++;
    });

    let bestPlatform = 'None';
    let maxPlatformPitches = 0;
    Object.keys(platformCounts).forEach(p => {
      if (platformCounts[p] > maxPlatformPitches) {
        maxPlatformPitches = platformCounts[p];
        bestPlatform = p;
      }
    });

    let bestCategory = 'None';
    let maxCategoryPitches = 0;
    Object.keys(categoryCounts).forEach(c => {
      if (categoryCounts[c] > maxCategoryPitches) {
        maxCategoryPitches = categoryCounts[c];
        bestCategory = c;
      }
    });

    return {
      weeklyTotal: weeklyEntries.length,
      monthlyTotal: monthlyEntries.length,
      bestPlatform,
      bestCategory
    };
  };

  const stats = getStatistics();

  // PREPARE OUTREACH WEEKLY CHART DATA
  const getGraphData = () => {
    const labels: string[] = [];
    const instaPitches: number[] = [];
    const emailPitches: number[] = [];
    const linkedinPitches: number[] = [];

    const baseDate = new Date(selectedDate);
    // Fetch last 7 days ending today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      
      const dayEntries = outreachEntries.filter(e => e.date === dateStr);
      let instaCount = 0;
      let emailCount = 0;
      let linkedinCount = 0;

      dayEntries.forEach(e => {
        if (e.instagram) instaCount++;
        if (e.email) emailCount++;
        if (e.linkedin) linkedinCount++;
      });

      instaPitches.push(instaCount);
      emailPitches.push(emailCount);
      linkedinPitches.push(linkedinCount);
    }

    return {
      labels,
      datasets: [
        { label: 'Instagram', values: instaPitches, color: '#e1306c' },
        { label: 'Email', values: emailPitches, color: '#ea4335' },
        { label: 'LinkedIn', values: linkedinPitches, color: '#0077b5' },
      ],
    };
  };

  const graphData = getGraphData();

  // FILTERED HISTORY LIST
  const getFilteredEntries = () => {
    let result = [...outreachEntries];

    if (filterCategory !== 'All') {
      result = result.filter(e => e.category === filterCategory);
    }

    if (filterPlatform !== 'All') {
      result = result.filter(e => {
        if (filterPlatform === 'Email') return !!e.email;
        if (filterPlatform === 'Instagram') return !!e.instagram;
        if (filterPlatform === 'LinkedIn') return !!e.linkedin;
        if (filterPlatform === 'Facebook') return !!e.facebook;
        if (filterPlatform === 'Twitter') return !!e.twitter;
        return true;
      });
    }

    if (sortOrder === 'newest') {
      result.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      result.sort((a, b) => a.date.localeCompare(b.date));
    }

    return result;
  };

  const filteredHistory = getFilteredEntries();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Category Selection Header */}
      <Text style={styles.sectionTitle}>Daily Category Focus</Text>
      <Card style={styles.categoryCard}>
        <Text style={styles.categoryCardSub}>Primary targeting sector for today:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {outreachCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[styles.catBadge, selectedCategory === cat && styles.catBadgeActive]}
            >
              <Text style={[styles.catBadgeText, selectedCategory === cat && styles.catBadgeTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity 
            onPress={() => setShowAddCat(!showAddCat)} 
            style={[styles.catBadge, styles.catBadgeAdd]}
          >
            <Plus size={12} color={THEME.colors.primary} style={{ marginRight: 2 }} />
            <Text style={[styles.catBadgeText, { color: THEME.colors.primary }]}>Custom</Text>
          </TouchableOpacity>
        </ScrollView>

        {showAddCat && (
          <View style={styles.addCatRow}>
            <TextInput
              value={customCatInput}
              onChangeText={setCustomCatInput}
              placeholder="e.g. Real Estate, Fitness Gyms"
              placeholderTextColor={THEME.colors.textMuted}
              style={styles.addCatInput}
              onSubmitEditing={handleAddCategory}
            />
            <TouchableOpacity onPress={handleAddCategory} style={styles.addCatSave}>
              <Text style={styles.addCatSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* Outreach Input Form */}
      <Text style={styles.sectionTitle}>Log New Pitch</Text>
      <Card style={styles.formCard}>
        <Input
          label="Business Title"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Blue Sky Dental Clinic"
        />

        <Input
          label="Website Link (Optional)"
          value={website}
          onChangeText={setWebsite}
          placeholder="e.g. https://blueskydental.com"
          keyboardType="url"
        />

        <Text style={styles.platformHeader}>Select Pitch Platforms</Text>
        
        {/* Platforms selectors checkboxes row */}
        <View style={styles.checkboxRow}>
          <TouchableOpacity 
            onPress={() => togglePlatformCheckbox('email')} 
            style={[styles.platformSelector, activePlatforms.email && styles.platformSelectorActive]}
          >
            <Mail size={14} color={activePlatforms.email ? '#ea4335' : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.platformSelectorText, activePlatforms.email && styles.platformSelectorTextActive]}>Email</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => togglePlatformCheckbox('instagram')} 
            style={[styles.platformSelector, activePlatforms.instagram && styles.platformSelectorActive]}
          >
            <Send size={14} color={activePlatforms.instagram ? '#e1306c' : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.platformSelectorText, activePlatforms.instagram && styles.platformSelectorTextActive]}>Instagram</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => togglePlatformCheckbox('linkedin')} 
            style={[styles.platformSelector, activePlatforms.linkedin && styles.platformSelectorActive]}
          >
            <Send size={14} color={activePlatforms.linkedin ? '#0077b5' : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.platformSelectorText, activePlatforms.linkedin && styles.platformSelectorTextActive]}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxRow}>
          <TouchableOpacity 
            onPress={() => togglePlatformCheckbox('facebook')} 
            style={[styles.platformSelector, activePlatforms.facebook && styles.platformSelectorActive]}
          >
            <Users size={14} color={activePlatforms.facebook ? '#1877f2' : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.platformSelectorText, activePlatforms.facebook && styles.platformSelectorTextActive]}>Facebook</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => togglePlatformCheckbox('twitter')} 
            style={[styles.platformSelector, activePlatforms.twitter && styles.platformSelectorActive]}
          >
            <Globe size={14} color={activePlatforms.twitter ? '#1da1f2' : THEME.colors.textMuted} style={{ marginRight: 4 }} />
            <Text style={[styles.platformSelectorText, activePlatforms.twitter && styles.platformSelectorTextActive]}>X (Twitter)</Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Platform Inputs */}
        {activePlatforms.email && (
          <Input
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            placeholder="e.g. contact@business.com"
            keyboardType="email-address"
          />
        )}
        {activePlatforms.instagram && (
          <Input
            label="Instagram Username"
            value={instaHandle}
            onChangeText={setInstaHandle}
            placeholder="e.g. @blueskydental"
          />
        )}
        {activePlatforms.linkedin && (
          <Input
            label="LinkedIn URL"
            value={linkedinLink}
            onChangeText={setLinkedinLink}
            placeholder="e.g. linkedin.com/company/blueskydental"
          />
        )}
        {activePlatforms.facebook && (
          <Input
            label="Facebook Page Link"
            value={fbLink}
            onChangeText={setFbLink}
            placeholder="e.g. facebook.com/blueskydental"
          />
        )}
        {activePlatforms.twitter && (
          <Input
            label="Twitter Handle"
            value={twitterHandle}
            onChangeText={setTwitterHandle}
            placeholder="e.g. @blueskydental"
          />
        )}

        <Button
          title="Save Outreach Pitch"
          onPress={handleLogOutreach}
          variant="primary"
          style={styles.submitBtn}
        />
      </Card>

      {/* KPI Cards Grid */}
      <View style={styles.statsGrid}>
        <Card style={[styles.statsCard, { borderColor: 'rgba(139, 92, 246, 0.25)', shadowColor: '#8b5cf6', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, borderWidth: 1.5 }]}>
          <Text style={styles.statsLabel}>Weekly Pitches</Text>
          <Text style={[styles.statsVal, { color: '#8b5cf6' }]}>{stats.weeklyTotal}</Text>
          <Text style={styles.statsDesc}>Last 7 Days</Text>
        </Card>
        
        <Card style={[styles.statsCard, { borderColor: 'rgba(16, 185, 129, 0.25)', shadowColor: '#10b981', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, borderWidth: 1.5 }]}>
          <Text style={styles.statsLabel}>Monthly Pitches</Text>
          <Text style={[styles.statsVal, { color: '#10b981' }]}>{stats.monthlyTotal}</Text>
          <Text style={styles.statsDesc}>Last 30 Days</Text>
        </Card>
      </View>

      <View style={styles.statsGrid}>
        <Card style={[styles.statsCard, { borderColor: 'rgba(245, 158, 11, 0.25)', shadowColor: '#f59e0b', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, borderWidth: 1.5 }]}>
          <Text style={styles.statsLabel}>Top Platform</Text>
          <Text style={[styles.statsValShort, { color: '#f59e0b' }]}>{stats.bestPlatform}</Text>
          <Text style={styles.statsDesc}>Highest Channel</Text>
        </Card>
        
        <Card style={[styles.statsCard, { borderColor: 'rgba(139, 92, 246, 0.25)', shadowColor: '#8b5cf6', shadowOpacity: 0.15, shadowRadius: 8, elevation: 3, borderWidth: 1.5 }]}>
          <Text style={styles.statsLabel}>Top Sector</Text>
          <Text style={[styles.statsValShort, { color: '#8b5cf6' }]} numberOfLines={1}>{stats.bestCategory}</Text>
          <Text style={styles.statsDesc}>Most Targeted Sector</Text>
        </Card>
      </View>

      {/* Outreach Weekly SVG Graph */}
      <Text style={styles.sectionTitle}>Weekly Pitch Performance</Text>
      <Card style={styles.graphCard}>
        {outreachEntries.length > 0 ? (
          <CustomChart
            type="line"
            labels={graphData.labels}
            datasets={graphData.datasets}
            minY={0}
            maxY={Math.max(5, ...graphData.datasets.flatMap(d => d.values)) + 1}
            ySuffix=""
            height={180}
          />
        ) : (
          <Text style={styles.emptyText}>No outreach logs available for graphing.</Text>
        )}
      </Card>

      {/* Outreach CRM History logs list */}
      <View style={styles.historyHeaderRow}>
        <Text style={styles.sectionTitle}>CRM Logs History</Text>
        <View style={styles.sortButtons}>
          <TouchableOpacity 
            onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            style={styles.sortBtn}
          >
            <Filter size={12} color={THEME.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.sortBtnText}>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Options */}
      <Card style={styles.filterCard}>
        <View style={styles.filterRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.filterLabel}>Filter Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity 
                onPress={() => setFilterCategory('All')} 
                style={[styles.filterBadge, filterCategory === 'All' && styles.filterBadgeActive]}
              >
                <Text style={[styles.filterBadgeText, filterCategory === 'All' && styles.filterBadgeTextActive]}>All</Text>
              </TouchableOpacity>
              {outreachCategories.map(c => (
                <TouchableOpacity 
                  key={c}
                  onPress={() => setFilterCategory(c)} 
                  style={[styles.filterBadge, filterCategory === c && styles.filterBadgeActive]}
                >
                  <Text style={[styles.filterBadgeText, filterCategory === c && styles.filterBadgeTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={[styles.filterRow, { marginTop: 8 }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.filterLabel}>Filter Platform</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {['All', 'Email', 'Instagram', 'LinkedIn', 'Facebook', 'Twitter'].map(p => (
                <TouchableOpacity 
                  key={p}
                  onPress={() => setFilterPlatform(p)} 
                  style={[styles.filterBadge, filterPlatform === p && styles.filterBadgeActive]}
                >
                  <Text style={[styles.filterBadgeText, filterPlatform === p && styles.filterBadgeTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Card>

      {/* List */}
      {filteredHistory.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Send size={24} color={THEME.colors.textMuted} style={{ marginBottom: 6 }} />
          <Text style={styles.emptyText}>No filtered outreach logs found.</Text>
        </Card>
      ) : (
        filteredHistory.map((item) => (
          <Card key={item.id} style={styles.historyItemCard}>
            <View style={styles.historyItemHeader}>
              <View>
                <Text style={styles.historyItemName}>{item.business_name}</Text>
                <View style={styles.historyMetaRow}>
                  <Text style={styles.historyCategoryBadge}>{item.category}</Text>
                  <Text style={styles.historyDate}>🗓️ {item.date}</Text>
                </View>
              </View>
            </View>

            <View style={styles.historyPlatformsRow}>
              {item.website && (
                <View style={styles.platformBadge}>
                  <Globe size={11} color={THEME.colors.textMuted} style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>Web</Text>
                </View>
              )}
              {item.email && (
                <View style={styles.platformBadge}>
                  <Mail size={11} color="#ea4335" style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>Email: {item.email}</Text>
                </View>
              )}
              {item.instagram && (
                <View style={styles.platformBadge}>
                  <Send size={11} color="#e1306c" style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>Insta: {item.instagram}</Text>
                </View>
              )}
              {item.linkedin && (
                <View style={styles.platformBadge}>
                  <Send size={11} color="#0077b5" style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>LinkedIn</Text>
                </View>
              )}
              {item.facebook && (
                <View style={styles.platformBadge}>
                  <Users size={11} color="#1877f2" style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>FB</Text>
                </View>
              )}
              {item.twitter && (
                <View style={styles.platformBadge}>
                  <Globe size={11} color="#1da1f2" style={{ marginRight: 3 }} />
                  <Text style={styles.platformBadgeText}>X</Text>
                </View>
              )}
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  contentContainer: {
    padding: THEME.spacing.lg,
    paddingBottom: 110,
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    letterSpacing: 0.3,
  },
  categoryCard: {
    padding: THEME.spacing.md,
  },
  categoryCardSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginBottom: THEME.spacing.sm,
  },
  catScroll: {
    flexDirection: 'row',
  },
  catBadge: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.sm + 4,
    paddingVertical: THEME.spacing.xs + 2,
    marginRight: THEME.spacing.xs,
  },
  catBadgeActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  catBadgeAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  catBadgeText: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  catBadgeTextActive: {
    color: '#ffffff',
  },
  addCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: THEME.spacing.sm,
  },
  addCatInput: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.sm,
    color: THEME.colors.text,
    paddingHorizontal: THEME.spacing.sm,
    height: 38,
    fontSize: 12.5,
  },
  addCatSave: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: THEME.spacing.md,
    height: 38,
    justifyContent: 'center',
    marginLeft: THEME.spacing.xs,
  },
  addCatSaveText: {
    color: '#fff',
    fontSize: 12.5,
    fontWeight: '600',
  },
  formCard: {
    padding: THEME.spacing.md,
  },
  platformHeader: {
    color: THEME.colors.text,
    fontSize: 13.5,
    fontWeight: '600',
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: THEME.spacing.xs,
  },
  platformSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.sm + 2,
    marginHorizontal: 3,
  },
  platformSelectorActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: THEME.colors.accentPurple,
  },
  platformSelectorText: {
    color: THEME.colors.textMuted,
    fontSize: 12.5,
    fontWeight: '600',
  },
  platformSelectorTextActive: {
    color: THEME.colors.text,
  },
  submitBtn: {
    marginTop: THEME.spacing.md,
    width: '100%',
  },
  statsGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: -4,
  },
  statsCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: THEME.spacing.md,
  },
  statsLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statsVal: {
    color: THEME.colors.primary,
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 2,
  },
  statsValShort: {
    color: THEME.colors.accentBlue,
    fontSize: 16,
    fontWeight: '800',
    marginVertical: 4,
  },
  statsDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  graphCard: {
    padding: THEME.spacing.sm,
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: THEME.spacing.xl,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  sortButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surfaceCard,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.radius.sm,
    marginTop: 8,
  },
  sortBtnText: {
    color: THEME.colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  filterCard: {
    padding: THEME.spacing.sm + 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  filterBadge: {
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  filterBadgeActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  filterBadgeText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  historyItemCard: {
    padding: THEME.spacing.md,
    marginVertical: 4,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyItemName: {
    color: THEME.colors.text,
    fontSize: 14.5,
    fontWeight: '700',
  },
  historyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  historyCategoryBadge: {
    backgroundColor: THEME.colors.surface,
    color: THEME.colors.primary,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    fontSize: 9.5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    fontWeight: '700',
    marginRight: 8,
  },
  historyDate: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '500',
  },
  historyPlatformsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: THEME.spacing.sm,
    marginHorizontal: -2,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    margin: 2,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  platformBadgeText: {
    color: THEME.colors.text,
    fontSize: 10,
    fontWeight: '500',
  },
  emptyCard: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
