import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Image, FlatList, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Text, Searchbar, Card, Button, useTheme, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { STORE_CATEGORIES, PICKUP_TIMES } from '../../config';

const HomeScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [featuredOffers, setFeaturedOffers] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Simulate fetching data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API calls
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for featured offers
      const mockFeaturedOffers = [
        {
          id: '1',
          title: 'سلة فواكه متنوعة',
          store: 'سوبر ماركت المدينة',
          originalPrice: 2500,
          price: 1000,
          discount: 60,
          distance: 1.2,
          rating: 4.5,
          image: 'https://images.unsplash.com/photo-1542838132-92d533f91e39?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          pickupTime: PICKUP_TIMES[3],
          category: 'supermarket'
        },
        {
          id: '2',
          title: 'مخبوزات طازجة',
          store: 'مخبز الأصيل',
          originalPrice: 800,
          price: 300,
          discount: 62,
          distance: 0.8,
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          pickupTime: PICKUP_TIMES[2],
          category: 'bakery'
        },
        {
          id: '3',
          title: 'وجبة عشاء كاملة',
          store: 'مطعم الشيف',
          originalPrice: 2000,
          price: 800,
          discount: 60,
          distance: 2.1,
          rating: 4.3,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          pickupTime: PICKUP_TIMES[4],
          category: 'restaurant'
        },
      ];

      // Mock data for nearby stores
      const mockNearbyStores = [
        {
          id: 's1',
          name: 'مخبز الأصيل',
          category: 'bakery',
          rating: 4.8,
          distance: 0.8,
          image: 'https://images.unsplash.com/photo-1542838132-92d533f91e39?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          offersCount: 5
        },
        {
          id: 's2',
          name: 'سوبر ماركت المدينة',
          category: 'supermarket',
          rating: 4.5,
          distance: 1.2,
          image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          offersCount: 8
        },
        {
          id: 's3',
          name: 'مطعم الشيف',
          category: 'restaurant',
          rating: 4.3,
          distance: 2.1,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          offersCount: 3
        },
        {
          id: 's4',
          name: 'مقهى اللافازا',
          category: 'cafe',
          rating: 4.7,
          distance: 1.5,
          image: 'https://images.unsplash.com/photo-1495474475677-df52a37cfc80?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
          offersCount: 4
        },
      ];

      setFeaturedOffers(mockFeaturedOffers);
      setNearbyStores(mockNearbyStores);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  // Filter offers by category
  const filteredOffers = selectedCategory === 'all' 
    ? featuredOffers 
    : featuredOffers.filter(offer => offer.category === selectedCategory);

  // Render offer item
  const renderOfferItem = ({ item }) => (
    <Card 
      style={[styles.offerCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('OfferDetails', { offerId: item.id })}
    >
      <Card.Cover source={{ uri: item.image }} style={styles.offerImage} />
      <View style={styles.offerBadge}>
        <Text style={styles.offerBadgeText}>-{item.discount}%</Text>
      </View>
      <Card.Content style={styles.offerContent}>
        <View style={styles.offerHeader}>
          <Text style={styles.offerTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.offerStore} numberOfLines={1}>{item.store}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{item.originalPrice} د.ج</Text>
          <Text style={[styles.discountedPrice, { color: colors.primary }]}>{item.price} د.ج</Text>
        </View>
        <View style={styles.distanceContainer}>
          <MaterialCommunityIcons name="map-marker-distance" size={16} color={colors.primary} />
          <Text style={styles.distanceText}>{item.distance} كم</Text>
          <View style={styles.pickupTime}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
            <Text style={styles.pickupTimeText}>{item.pickupTime}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  // Render store item
  const renderStoreItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.storeCard, { backgroundColor: colors.surface }]}
      onPress={() => navigation.navigate('StoreDetails', { storeId: item.id })}
    >
      <Image source={{ uri: item.image }} style={styles.storeImage} />
      <View style={styles.storeInfo}>
        <Text style={styles.storeName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.storeDetails}>
          <View style={styles.ratingContainer}>
            <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
          <Text style={styles.storeDistance}>{item.distance} كم</Text>
        </View>
        <View style={styles.offersCount}>
          <Text style={styles.offersCountText}>{item.offersCount} عروض</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>أهلاً بك {user?.name || 'عزيزي'}</Text>
          <Text style={styles.subGreeting}>ما الذي تريد تناوله اليوم؟</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Notifications')}>
          <MaterialCommunityIcons 
            name="bell-outline" 
            size={24} 
            color={colors.text} 
            style={styles.notificationIcon} 
          />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="ابحث عن وجبات أو متاجر"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          placeholderTextColor={colors.textLight}
          icon="magnify"
          iconColor={colors.primary}
          elevation={0}
        />
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Filters')}
        >
          <MaterialCommunityIcons name="tune" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>التصنيفات</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Categories')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity 
            style={[
              styles.categoryItem, 
              selectedCategory === 'all' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <MaterialCommunityIcons 
              name="view-grid-outline" 
              size={24} 
              color={selectedCategory === 'all' ? '#fff' : colors.primary} 
            />
            <Text 
              style={[
                styles.categoryText, 
                { color: selectedCategory === 'all' ? '#fff' : colors.text }
              ]}
            >
              الكل
            </Text>
          </TouchableOpacity>
          
          {STORE_CATEGORIES.map(category => (
            <TouchableOpacity 
              key={category.id}
              style={[
                styles.categoryItem, 
                selectedCategory === category.id && { backgroundColor: colors.primary }
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <MaterialCommunityIcons 
                name={category.icon} 
                size={24} 
                color={selectedCategory === category.id ? '#fff' : colors.primary} 
              />
              <Text 
                style={[
                  styles.categoryText, 
                  { color: selectedCategory === category.id ? '#fff' : colors.text }
                ]}
                numberOfLines={1}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Featured Offers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>عروض مميزة</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllOffers')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
        
        {filteredOffers.length > 0 ? (
          <FlatList
            data={filteredOffers}
            renderItem={renderOfferItem}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.offersList}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="emoticon-sad-outline" size={48} color={colors.textLight} />
            <Text style={[styles.emptyStateText, { color: colors.textLight }]}>
              لا توجد عروض متاحة في هذا التصنيف حالياً
            </Text>
          </View>
        )}
      </View>

      {/* Nearby Stores */}
      <View style={[styles.section, { marginBottom: 90 }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>متاجر قريبة منك</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AllStores')}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>عرض الكل</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={nearbyStores}
          renderItem={renderStoreItem}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.storesRow}
          contentContainerStyle={styles.storesList}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  subGreeting: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  notificationIcon: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    elevation: 0,
  },
  searchInput: {
    textAlign: 'right',
    paddingRight: 10,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoriesContainer: {
    paddingVertical: 8,
  },
  categoryItem: {
    width: 80,
    height: 90,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    padding: 8,
  },
  categoryText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  offersList: {
    paddingVertical: 8,
  },
  offerCard: {
    width: 260,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  offerImage: {
    height: 140,
  },
  offerBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF5252',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  offerContent: {
    padding: 12,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  offerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
  },
  offerStore: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
    color: '#999',
    marginLeft: 8,
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  pickupTime: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  pickupTimeText: {
    fontSize: 12,
    color: '#666',
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyStateText: {
    marginTop: 12,
    textAlign: 'center',
  },
  storesList: {
    paddingBottom: 8,
  },
  storesRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  storeCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
  },
  storeImage: {
    width: '100%',
    height: 100,
  },
  storeInfo: {
    padding: 12,
  },
  storeName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  storeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeDistance: {
    fontSize: 12,
    color: '#666',
  },
  offersCount: {
    backgroundColor: '#f0f7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  offersCountText: {
    fontSize: 10,
    color: '#0066cc',
    fontWeight: '500',
  },
});

export default HomeScreen;
