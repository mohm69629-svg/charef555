import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Button, DataTable, ActivityIndicator, useTheme, Text } from 'react-native-paper';
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as adminService from '../../services/adminService';

const AdminDashboard = ({ navigation }) => {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // البيانات الافتراضية للعرض
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSellers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: []
  });

  // دالة تحميل بيانات لوحة التحكم
  const loadDashboardData = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // جلب البيانات من الخادم
      const [statsData, recentOrders, recentUsers] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentOrders(5),
        adminService.getRecentUsers(5)
      ]);
      
      setStats({
        ...statsData,
        recentOrders,
        recentUsers
      });
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert(
        'خطأ في تحميل البيانات',
        'حدث خطأ أثناء تحميل بيانات لوحة التحكم. يرجى المحاولة مرة أخرى لاحقاً.',
        [{ text: 'حسناً' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, []);

    // بطاقة عرض الإحصائيات
  const StatCard = ({ icon, title, value, color, onPress }) => (
    <Card 
      style={[styles.card, styles.statCard]} 
      onPress={onPress}
      elevation={2}
    >
      <Card.Content style={styles.statCardContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          {icon}
        </View>
        <View style={styles.statTextContainer}>
          <Paragraph style={styles.statLabel} numberOfLines={1}>{title}</Paragraph>
          <Title style={[styles.statValue, { color }]} numberOfLines={1}>
            {value}
          </Title>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={loadDashboardData} 
          colors={[theme.colors.primary]}
        />
      }
    >
      {/* العنوان */}
      <View style={styles.header}>
        <Title style={styles.title}>لوحة تحكم المشرف</Title>
        <Button 
          icon="cog" 
          mode="contained" 
          onPress={() => navigation.navigate('AdminSettings')}
          style={styles.settingsButton}
        >
          الإعدادات
        </Button>
      </View>

      {/* بطاقات الإحصائيات */}
      <View style={styles.statsContainer}>
        <StatCard 
          icon={<FontAwesome5 name="users" size={24} color="#4CAF50" />}
          title="إجمالي المستخدمين"
          value={stats.totalUsers?.toLocaleString('ar') || '0'}
          color="#4CAF50"
          onPress={() => navigation.navigate('AdminUsers')}
        />
        <StatCard 
          icon={<MaterialIcons name="store" size={24} color="#2196F3" />}
          title="إجمالي البائعين"
          value={stats.totalSellers?.toLocaleString('ar') || '0'}
          color="#2196F3"
          onPress={() => navigation.navigate('AdminSellers')}
        />
        <StatCard 
          icon={<MaterialIcons name="shopping-cart" size={24} color="#FF9800" />}
          title="إجمالي الطلبات"
          value={stats.totalOrders?.toLocaleString('ar') || '0'}
          color="#FF9800"
          onPress={() => navigation.navigate('AdminOrders')}
        />
        <StatCard 
          icon={<MaterialCommunityIcons name="cash-multiple" size={24} color="#9C27B0" />}
          title="إجمالي الإيرادات"
          value={formatCurrency(stats.totalRevenue || 0)}
          color="#9C27B0"
          onPress={() => navigation.navigate('AdminRevenue')}
        />
      </View>

      {/* أحدث الطلبات */}
      <Card style={styles.sectionCard}>
        <Card.Title 
          title="أحدث الطلبات" 
          titleStyle={styles.sectionTitle}
          right={() => (
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('AdminOrders')}
              style={styles.seeAllButton}
            >
              عرض الكل
            </Button>
          )}
        />
        <Card.Content>
          {stats.recentOrders.length > 0 ? (
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>رقم الطلب</DataTable.Title>
                <DataTable.Title>العميل</DataTable.Title>
                <DataTable.Title numeric>المبلغ</DataTable.Title>
                <DataTable.Title>الحالة</DataTable.Title>
              </DataTable.Header>

              {stats.recentOrders.map((order) => (
                <DataTable.Row 
                  key={order.id}
                  onPress={() => navigation.navigate('AdminOrderDetails', { orderId: order.id })}
                >
                  <DataTable.Cell>#{order.id}</DataTable.Cell>
                  <DataTable.Cell>{order.customer}</DataTable.Cell>
                  <DataTable.Cell numeric>{order.amount} د.ج</DataTable.Cell>
                  <DataTable.Cell>
                    <View style={[styles.statusBadge, { 
                      backgroundColor: getStatusColor(order.status).background,
                    }]}>
                      <Text style={[styles.statusText, { 
                        color: getStatusColor(order.status).color 
                      }]}>
                        {order.status}
                      </Text>
                    </View>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          ) : (
            <Paragraph style={styles.noDataText}>لا توجد طلبات حديثة</Paragraph>
          )}
        </Card.Content>
      </Card>

      {/* أحدث المستخدمين */}
      <Card style={[styles.sectionCard, { marginBottom: 20 }]}>
        <Card.Title 
          title="أحدث المستخدمين" 
          titleStyle={styles.sectionTitle}
          right={() => (
            <Button 
              mode="text" 
              onPress={() => navigation.navigate('AdminUsers')}
              style={styles.seeAllButton}
              labelStyle={{ fontSize: 12 }}
            >
              عرض الكل
            </Button>
          )}
        />
        <Card.Content style={{ padding: 0 }}>
          {stats.recentUsers && stats.recentUsers.length > 0 ? (
            <View>
              {stats.recentUsers.map((user) => {
                const userRole = user.role === 'admin' ? 'مدير' : user.role === 'seller' ? 'بائع' : 'عميل';
                const roleColor = user.role === 'admin' ? '#FF5722' : user.role === 'seller' ? '#2196F3' : '#4CAF50';
                const userInitial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
                
                return (
                  <TouchableOpacity 
                    key={user.id}
                    style={styles.userItem}
                    onPress={() => navigation.navigate('AdminUserDetails', { userId: user.id })}
                  >
                    <View style={[styles.userAvatar, { backgroundColor: getRandomColor(user.id) }]}>
                      <Text style={styles.avatarText}>{userInitial}</Text>
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.name || 'مستخدم جديد'}
                      </Text>
                      <Text style={styles.userEmail} numberOfLines={1}>
                        {user.email}
                      </Text>
                      <View style={styles.userMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: `${roleColor}20` }]}>
                          <Text style={[styles.roleText, { color: roleColor }]}>{userRole}</Text>
                        </View>
                        <Text style={styles.joinDate}>
                          {formatDate(user.createdAt)}
                        </Text>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-left" size={24} color="#bdc3c7" />
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="people-outline" size={48} color="#e0e0e0" />
              <Text style={styles.emptyStateText}>لا يوجد مستخدمون مسجلون بعد</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

// دالة مساعدة لتنسيق التاريخ
const formatDate = (dateString) => {
  if (!dateString) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateString).toLocaleDateString('ar-SA', options);
};

// دالة مساعدة لتنسيق المبالغ المالية
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ar-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// دالة مساعدة لإنشاء لون عشوائي بناءً على النص
const getRandomColor = (str) => {
  // إنشاء لون عشوائي بناءً على نص الإدخال
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

// دالة مساعدة للحصول على لون الحالة
const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
    case 'مكتمل':
      return { background: '#E8F5E9', color: '#2E7D32' };
    case 'processing':
    case 'قيد التجهيز':
      return { background: '#FFF8E1', color: '#FF8F00' };
    case 'cancelled':
    case 'ملغي':
      return { background: '#FFEBEE', color: '#C62828' };
    case 'pending':
    case 'قيد الانتظار':
      return { background: '#E3F2FD', color: '#1565C0' };
    case 'shipped':
    case 'تم الشحن':
      return { background: '#E1F5FE', color: '#0277BD' };
    case 'delivered':
    case 'تم التوصيل':
      return { background: '#E8F5E9', color: '#2E7D32' };
    default:
      return { background: '#F5F5F5', color: '#424242' };
  }

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  settingsButton: {
    borderRadius: 8,
    padding: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 16,
  },
  sectionCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  seeAllButton: {
    marginRight: 8,
  },
  noDataText: {
    textAlign: 'center',
    color: '#7f8c8d',
    padding: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    width: '48%',
    marginBottom: 15,
    borderRadius: 10,
    elevation: 2,
  },
  statCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  statTextContainer: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // User Item Styles
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    marginRight: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  joinDate: {
    fontSize: 11,
    color: '#95a5a6',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    marginTop: 12,
    color: '#95a5a6',
    textAlign: 'center',
    fontSize: 14,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginRight: 10,
  },
  noDataText: {
    textAlign: 'center',
    color: '#999',
    marginVertical: 10,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  userTypeText: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default AdminDashboard;
