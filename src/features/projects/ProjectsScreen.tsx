import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { THEME } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CustomChart } from '../../components/CustomChart';
import { DBService } from '../../services/db';
import { Briefcase, Plus, Clock, Award, DollarSign, BarChart2, CheckCircle2, CircleDot, Code, Users, RefreshCw } from 'lucide-react-native';
import { Project, ProjectLog } from '../../types';

export const ProjectsScreen: React.FC = () => {
  const {
    selectedDate,
    projects,
    createProject,
    logWork,
    toggleProjectComplete,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [showAddProject, setShowAddProject] = useState(false);
  const [showLogHours, setShowLogHours] = useState(false);

  // Add Project Form States
  const [projTitle, setProjTitle] = useState('');
  const [projCat, setProjCat] = useState('');
  const [projStack, setProjStack] = useState('');
  const [projAmount, setProjAmount] = useState('');
  const [projDuration, setProjDuration] = useState('');

  // Log Hours Form States
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [loggedHours, setLoggedHours] = useState('');

  const [allLogs, setAllLogs] = useState<ProjectLog[]>([]);

  // Load logs range for charts
  useEffect(() => {
    const today = new Date(selectedDate);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 6);
    const startStr = oneWeekAgo.toISOString().split('T')[0];
    const endStr = today.toISOString().split('T')[0];
    
    const logs = DBService.getAllProjectLogsRange(startStr, endStr);
    setAllLogs(logs);
  }, [selectedDate, projects]);

  const handleCreateProject = () => {
    if (!projTitle.trim() || !projCat.trim() || !projAmount.trim()) {
      Alert.alert('Required Info', 'Project Title, Category, and Amount are required.');
      return;
    }

    createProject({
      title: projTitle.trim(),
      category: projCat.trim(),
      tech_stack: projStack.trim(),
      amount: Number(projAmount),
      expected_duration: projDuration.trim(),
    });

    // Reset
    setProjTitle('');
    setProjCat('');
    setProjStack('');
    setProjAmount('');
    setProjDuration('');
    setShowAddProject(false);

    Alert.alert('Success', 'Project created successfully!');
  };

  const handleLogHours = () => {
    if (selectedProjectId === null) {
      Alert.alert('Select Project', 'Please select a project to log hours against.');
      return;
    }
    const hoursNum = Number(loggedHours);
    if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
      Alert.alert('Invalid Hours', 'Please enter a valid number of hours worked (0 - 24).');
      return;
    }

    logWork(selectedProjectId, hoursNum);

    // Reset
    setLoggedHours('');
    setShowLogHours(false);

    Alert.alert('Success', `Logged ${hoursNum} hours for today!`);
  };

  // CALCULATE PRODUCTIVITY METRICS
  const getProductivityMetrics = () => {
    const activeProjects = projects.filter(p => p.completed === 0);
    const completedProjects = projects.filter(p => p.completed === 1);

    // Total workload value
    const activeValue = activeProjects.reduce((acc, p) => acc + p.amount, 0);
    const totalEarned = completedProjects.reduce((acc, p) => acc + p.amount, 0);

    // Average hours worked per day in last 7 days
    const today = new Date(selectedDate);
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const recentLogs = allLogs.filter(l => last7Days.includes(l.date));
    const totalRecentHours = recentLogs.reduce((acc, l) => acc + l.hours_worked, 0);
    const avgHoursPerDay = Number((totalRecentHours / 7).toFixed(1));

    // Completion Speed (average days per completed project)
    const avgDaysCompleted = completedProjects.length > 0
      ? Math.round(completedProjects.reduce((acc, p) => acc + p.total_days, 0) / completedProjects.length)
      : 0;

    return {
      activeCount: activeProjects.length,
      completedCount: completedProjects.length,
      activeValue,
      totalEarned,
      avgHoursPerDay,
      avgDaysCompleted,
    };
  };

  const metrics = getProductivityMetrics();

  // WORK HOURS SVG GRAPH DATA
  const getGraphData = () => {
    const labels: string[] = [];
    const values: number[] = [];

    const baseDate = new Date(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      
      const dayLogs = allLogs.filter(l => l.date === dateStr);
      const dayTotal = dayLogs.reduce((acc, l) => acc + l.hours_worked, 0);
      values.push(dayTotal);
    }

    return {
      labels,
      datasets: [
        { label: 'Work Hours', values, color: THEME.colors.accentBlue },
      ],
    };
  };

  const graphData = getGraphData();
  const maxHoursLogged = Math.max(8, ...graphData.datasets[0].values);

  const activeProjectsList = projects.filter(p => p.completed === 0);
  const completedProjectsList = projects.filter(p => p.completed === 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Productivity Stats Cards Grid */}
      <Text style={styles.sectionTitle}>Productivity Analytics</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statsCard}>
          <Text style={styles.statsLabel}>Avg Hours/Day</Text>
          <View style={styles.statsValRow}>
            <Clock size={16} color={THEME.colors.accentBlue} style={{ marginRight: 4 }} />
            <Text style={styles.statsVal}>{metrics.avgHoursPerDay} hrs</Text>
          </View>
          <Text style={styles.statsDesc}>Weekly rolling average</Text>
        </Card>
        
        <Card style={styles.statsCard}>
          <Text style={styles.statsLabel}>Active Workload</Text>
          <View style={styles.statsValRow}>
            <DollarSign size={16} color={THEME.colors.primary} style={{ marginRight: 2 }} />
            <Text style={[styles.statsVal, { color: THEME.colors.primary }]}>{metrics.activeValue}</Text>
          </View>
          <Text style={styles.statsDesc}>{metrics.activeCount} Ongoing projects</Text>
        </Card>
      </View>

      <View style={styles.statsGrid}>
        <Card style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Revenue</Text>
          <View style={styles.statsValRow}>
            <DollarSign size={16} color={THEME.colors.primary} style={{ marginRight: 2 }} />
            <Text style={[styles.statsVal, { color: THEME.colors.primary }]}>{metrics.totalEarned}</Text>
          </View>
          <Text style={styles.statsDesc}>{metrics.completedCount} Completed projects</Text>
        </Card>
        
        <Card style={styles.statsCard}>
          <Text style={styles.statsLabel}>Completion Speed</Text>
          <View style={styles.statsValRow}>
            <Award size={16} color={THEME.colors.warning} style={{ marginRight: 4 }} />
            <Text style={styles.statsVal}>{metrics.avgDaysCompleted} days</Text>
          </View>
          <Text style={styles.statsDesc}>Avg execution duration</Text>
        </Card>
      </View>

      {/* Work Hours Bar Chart */}
      <Text style={styles.sectionTitle}>Work Consistency</Text>
      <Card style={styles.graphCard}>
        <Text style={styles.graphSub}>Total hours worked per day (last 7 days):</Text>
        <CustomChart
          type="bar"
          labels={graphData.labels}
          datasets={graphData.datasets}
          minY={0}
          maxY={maxHoursLogged}
          ySuffix=" hrs"
          height={160}
        />
      </Card>

      {/* Projects List Section */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Freelance Contracts</Text>
        <TouchableOpacity 
          onPress={() => setShowAddProject(true)}
          style={styles.addProjBtn}
        >
          <Plus size={12} color="#fff" style={{ marginRight: 4 }} />
          <Text style={styles.addProjBtnText}>Create Project</Text>
        </TouchableOpacity>
      </View>

      {/* Work logging trigger button */}
      {activeProjectsList.length > 0 && (
        <TouchableOpacity 
          onPress={() => {
            setSelectedProjectId(activeProjectsList[0].id || null);
            setShowLogHours(true);
          }} 
          style={styles.logHoursTrigger}
        >
          <Clock size={14} color="#fff" style={{ marginRight: 6 }} />
          <Text style={styles.logHoursTriggerText}>Log Work Session Hours</Text>
        </TouchableOpacity>
      )}

      {/* Tabs list active/completed */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('active')}
          style={[styles.tabBtn, activeTab === 'active' && styles.tabBtnActive]}
        >
          <CircleDot size={12} color={activeTab === 'active' ? THEME.colors.primary : THEME.colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[styles.tabBtnText, activeTab === 'active' && styles.tabBtnTextActive]}>
            Active ({metrics.activeCount})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('completed')}
          style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
        >
          <CheckCircle2 size={12} color={activeTab === 'completed' ? THEME.colors.primary : THEME.colors.textMuted} style={{ marginRight: 4 }} />
          <Text style={[styles.tabBtnText, activeTab === 'completed' && styles.tabBtnTextActive]}>
            Completed ({metrics.completedCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Projects Listing */}
      {activeTab === 'active' ? (
        activeProjectsList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Briefcase size={28} color={THEME.colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyText}>No active projects found. Create one above!</Text>
          </Card>
        ) : (
          activeProjectsList.map(p => (
            <Card key={p.id} style={[
              styles.projectCard,
              {
                borderColor: 'rgba(139, 92, 246, 0.15)', // Accent purple tint border
                shadowColor: '#8b5cf6',
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
              }
            ]}>
              <View style={styles.projHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.projTitle}>{p.title}</Text>
                  <Text style={styles.projCategory}>{p.category} | Expected: {p.expected_duration}</Text>
                </View>
                <Text style={styles.projAmount}>${p.amount}</Text>
              </View>

              <View style={styles.projDetails}>
                <View style={[styles.detailItem, { flex: 1.2 }]}>
                  <Code size={12} color="#8b5cf6" style={{ marginRight: 6 }} />
                  <View style={styles.techBadgeRow}>
                    {p.tech_stack.split(',').map((tech, tIdx) => (
                      <View key={tIdx} style={styles.techBadge}>
                        <Text style={styles.techBadgeText}>{tech.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={[styles.detailItem, { flex: 1, justifyContent: 'flex-end' }]}>
                  <Clock size={12} color={THEME.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.detailItemText}>Logs: {p.total_hours}h ({p.total_days}d)</Text>
                </View>
              </View>

              <View style={styles.projActions}>
                <TouchableOpacity 
                  onPress={() => {
                    setSelectedProjectId(p.id || null);
                    setShowLogHours(true);
                  }}
                  style={[styles.projActionBtn, styles.projActionLog]}
                >
                  <Clock size={12} color={THEME.colors.accentBlue} style={{ marginRight: 4 }} />
                  <Text style={[styles.projActionText, { color: THEME.colors.accentBlue }]}>Log Hours</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => toggleProjectComplete(p.id!)}
                  style={[styles.projActionBtn, styles.projActionComplete]}
                >
                  <CheckCircle2 size={12} color={THEME.colors.primary} style={{ marginRight: 4 }} />
                  <Text style={[styles.projActionText, { color: THEME.colors.primary }]}>Complete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )
      ) : (
        completedProjectsList.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Award size={28} color={THEME.colors.textMuted} style={{ marginBottom: 6 }} />
            <Text style={styles.emptyText}>No completed projects yet. Execute and finalize!</Text>
          </Card>
        ) : (
          completedProjectsList.map(p => (
            <Card key={p.id} style={[
              styles.projectCard, 
              { 
                opacity: 0.8,
                borderColor: 'rgba(16, 185, 129, 0.15)', // Completed green tint border
                shadowColor: '#10b981',
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 1,
              }
            ]}>
              <View style={styles.projHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.projTitle, { textDecorationLine: 'line-through' }]}>{p.title}</Text>
                  <Text style={styles.projCategory}>
                    Completed: {p.completion_date} | Spent: {p.total_days} days
                  </Text>
                </View>
                <Text style={[styles.projAmount, { color: THEME.colors.textMuted, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'transparent' }]}>${p.amount}</Text>
              </View>

              <View style={styles.projDetails}>
                <View style={[styles.detailItem, { flex: 1.2 }]}>
                  <Code size={12} color={THEME.colors.textMuted} style={{ marginRight: 6 }} />
                  <View style={styles.techBadgeRow}>
                    {p.tech_stack.split(',').map((tech, tIdx) => (
                      <View key={tIdx} style={[styles.techBadge, { backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }]}>
                        <Text style={[styles.techBadgeText, { color: THEME.colors.textMuted }]}>{tech.trim()}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={[styles.detailItem, { flex: 1, justifyContent: 'flex-end' }]}>
                  <Clock size={12} color={THEME.colors.textMuted} style={{ marginRight: 4 }} />
                  <Text style={styles.detailItemText}>Total worked: {p.total_hours} hrs</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => toggleProjectComplete(p.id!)}
                style={styles.reopenBtn}
              >
                <RefreshCw size={11} color={THEME.colors.textMuted} style={{ marginRight: 4 }} />
                <Text style={styles.reopenBtnText}>Re-open Project</Text>
              </TouchableOpacity>
            </Card>
          ))
        )
      )}

      {/* CREATE PROJECT MODAL */}
      <Modal visible={showAddProject} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Freelance Contract</Text>
            
            <Input
              label="Project Title"
              value={projTitle}
              onChangeText={setProjTitle}
              placeholder="e.g. E-Commerce Website"
            />
            
            <Input
              label="Category / Industry"
              value={projCat}
              onChangeText={setProjCat}
              placeholder="e.g. Web Development, UI/UX"
            />
            
            <Input
              label="Tech Stack"
              value={projStack}
              onChangeText={setProjStack}
              placeholder="e.g. React, Next.js, Tailwind"
            />

            <View style={styles.modalRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Input
                  label="Budget Amount ($)"
                  value={projAmount}
                  onChangeText={setProjAmount}
                  placeholder="e.g. 1500"
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="Expected Duration"
                  value={projDuration}
                  onChangeText={setProjDuration}
                  placeholder="e.g. 3 weeks"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowAddProject(false)}
                variant="secondary"
                style={styles.modalCancel}
              />
              <Button
                title="Save Project"
                onPress={handleCreateProject}
                variant="primary"
                style={styles.modalSave}
              />
            </View>
          </Card>
        </View>
      </Modal>

      {/* LOG WORK HOURS MODAL */}
      <Modal visible={showLogHours} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Project Work Hours</Text>

            <Text style={styles.labelSelect}>Select Project:</Text>
            <ScrollView style={styles.projectSelectScroll}>
              {activeProjectsList.map(p => (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setSelectedProjectId(p.id || null)}
                  style={[
                    styles.projectSelectOption,
                    selectedProjectId === p.id && styles.projectSelectOptionActive,
                  ]}
                >
                  <Text style={[styles.selectOptionText, selectedProjectId === p.id && { color: THEME.colors.primary }]}>
                    {p.title}
                  </Text>
                  {selectedProjectId === p.id && <CheckCircle2 size={14} color={THEME.colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <Input
              label="Hours Worked Today"
              value={loggedHours}
              onChangeText={setLoggedHours}
              placeholder="e.g. 4.5"
              keyboardType="numeric"
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowLogHours(false)}
                variant="secondary"
                style={styles.modalCancel}
              />
              <Button
                title="Log Session"
                onPress={handleLogHours}
                variant="primary"
                style={styles.modalSave}
              />
            </View>
          </Card>
        </View>
      </Modal>
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
  statsValRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statsVal: {
    color: THEME.colors.text,
    fontSize: 16.5,
    fontWeight: '800',
  },
  statsDesc: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  graphCard: {
    padding: THEME.spacing.sm + 2,
  },
  graphSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginBottom: THEME.spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: THEME.spacing.md,
  },
  addProjBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addProjBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  logHoursTrigger: {
    backgroundColor: THEME.colors.accentBlue,
    borderRadius: THEME.radius.md,
    paddingVertical: THEME.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: THEME.spacing.sm,
  },
  logHoursTriggerText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 41, 59, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 3,
    marginVertical: THEME.spacing.sm,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  techBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  techBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
    borderWidth: 1,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    marginRight: 4,
    marginBottom: 2,
  },
  techBadgeText: {
    color: '#8b5cf6',
    fontSize: 9,
    fontWeight: '700',
  },
  tabBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: THEME.colors.text,
  },
  projectCard: {
    padding: THEME.spacing.md,
    marginVertical: THEME.spacing.xs,
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  projTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  projCategory: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  projAmount: {
    color: THEME.colors.primary,
    fontSize: 15,
    fontWeight: '800',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
  },
  projDetails: {
    flexDirection: 'row',
    marginTop: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.sm,
    borderRadius: THEME.radius.sm,
    borderColor: THEME.colors.border,
    borderWidth: 1,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailItemText: {
    color: THEME.colors.text,
    fontSize: 11.5,
    fontWeight: '500',
  },
  projActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: THEME.spacing.md,
  },
  projActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.radius.md,
    paddingHorizontal: THEME.spacing.sm + 4,
    paddingVertical: THEME.spacing.xs + 2,
    marginLeft: THEME.spacing.sm,
    borderWidth: 1.5,
  },
  projActionLog: {
    borderColor: THEME.colors.accentBlue,
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  projActionComplete: {
    borderColor: THEME.colors.primary,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  projActionText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  reopenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1.5,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    marginTop: THEME.spacing.md,
  },
  reopenBtnText: {
    color: THEME.colors.textMuted,
    fontSize: 10.5,
    fontWeight: '600',
  },
  emptyCard: {
    padding: THEME.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: THEME.colors.textMuted,
    fontSize: 12.5,
    fontWeight: '500',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 11, 19, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'rgba(30, 41, 59, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderRadius: THEME.radius.lg,
    padding: THEME.spacing.lg,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    color: THEME.colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: THEME.spacing.md,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: THEME.spacing.lg,
  },
  modalCancel: {
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  modalSave: {
    flex: 1.5,
    marginLeft: THEME.spacing.sm,
  },
  labelSelect: {
    color: THEME.colors.text,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: THEME.spacing.xs,
  },
  projectSelectScroll: {
    maxHeight: 120,
    backgroundColor: THEME.colors.surface,
    borderColor: THEME.colors.border,
    borderWidth: 1,
    borderRadius: THEME.radius.md,
    marginBottom: THEME.spacing.sm,
  },
  projectSelectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.spacing.sm,
    borderBottomColor: THEME.colors.border,
    borderBottomWidth: 0.5,
  },
  projectSelectOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  selectOptionText: {
    color: THEME.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
});
