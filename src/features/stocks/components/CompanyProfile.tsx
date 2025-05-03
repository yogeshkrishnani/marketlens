import BusinessIcon from '@mui/icons-material/Business';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import {
  Box,
  Typography,
  Grid,
  Avatar,
  Skeleton,
  Divider,
  Link,
  Alert,
  Button,
} from '@mui/material';
import React, { useState } from 'react';

import { CompanyProfile as CompanyProfileType } from '../models/stockDetail';
import { formatDate } from '../utils/stockDetail';

interface CompanyProfileProps {
  profile: CompanyProfileType | undefined;
  isLoading: boolean;
  error: unknown;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ profile, isLoading, error }) => {
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (isLoading) {
    return <CompanyProfileSkeleton />;
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Unable to load company profile information.
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No company profile information available.
      </Alert>
    );
  }

  const descriptionIsTruncated = profile.description.length > 500;

  return (
    <Box>
      {/* Company Header with Logo */}
      <Box sx={{ display: 'flex', mb: 3, alignItems: 'flex-start' }}>
        {profile.logo ? (
          <Avatar
            src={profile.logo}
            alt={`${profile.name} logo`}
            variant="rounded"
            sx={{ width: 64, height: 64, mr: 2 }}
          />
        ) : (
          <Avatar variant="rounded" sx={{ width: 64, height: 64, mr: 2, bgcolor: 'primary.main' }}>
            {profile.symbol.charAt(0)}
          </Avatar>
        )}
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {profile.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {profile.symbol} • {profile.exchange}
          </Typography>
          {profile.website && (
            <Link
              href={
                profile.website.startsWith('http') ? profile.website : `https://${profile.website}`
              }
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '0.875rem',
                mt: 0.5,
                color: 'primary.main',
              }}
              underline="hover"
            >
              {profile.website.replace(/(^\w+:|^)\/\//, '').replace(/\/$/, '')}
              <OpenInNewIcon fontSize="small" sx={{ ml: 0.5, fontSize: '0.8rem' }} />
            </Link>
          )}
        </Box>
      </Box>

      {/* Company Description with Read More/Less */}
      <Box sx={{ mb: 3 }}>
        <Typography paragraph sx={{ mb: descriptionIsTruncated ? 1 : 3 }}>
          {showFullDescription
            ? profile.description
            : `${profile.description.substring(0, 500)}${descriptionIsTruncated ? '...' : ''}`}
        </Typography>

        {descriptionIsTruncated && (
          <Button
            variant="text"
            size="small"
            onClick={() => setShowFullDescription(!showFullDescription)}
            sx={{ mb: 2 }}
          >
            {showFullDescription ? 'Read Less' : 'Read More'}
          </Button>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Company Metadata */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Sector
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.sector || 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Industry
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.industry || 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PersonIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              CEO
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.ceo || 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <PeopleIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Employees
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.employees ? profile.employees.toLocaleString() : 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Headquarters
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.city && profile.country ? `${profile.city}, ${profile.country}` : 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Exchange
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.exchange || 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarTodayIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              IPO Date
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.ipoDate ? formatDate(profile.ipoDate) : 'N/A'}
          </Typography>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <BusinessIcon sx={{ color: 'text.secondary', mr: 1, fontSize: '1.2rem' }} />
            <Typography variant="body2" color="text.secondary">
              Currency
            </Typography>
          </Box>
          <Typography variant="body1" fontWeight={500}>
            {profile.currency || 'N/A'}
          </Typography>
        </Grid>
      </Grid>

      {/* Full Address (if available) */}
      {profile.address && (
        <Box sx={{ mt: 4 }}>
          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <LocationOnIcon sx={{ color: 'text.secondary', mr: 1, mt: 0.5, fontSize: '1.2rem' }} />
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Address
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {profile.address}
                {profile.city && `, ${profile.city}`}
                {profile.state && `, ${profile.state}`}
                {profile.zip && ` ${profile.zip}`}
                {profile.country && `, ${profile.country}`}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

// Loading skeleton for the company profile
const CompanyProfileSkeleton = () => {
  return (
    <Box>
      {/* Company Header Skeleton */}
      <Box sx={{ display: 'flex', mb: 3, alignItems: 'center' }}>
        <Skeleton variant="rounded" width={64} height={64} sx={{ mr: 2 }} />
        <Box sx={{ width: '50%' }}>
          <Skeleton variant="text" width="80%" height={32} />
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="60%" height={20} />
        </Box>
      </Box>

      {/* Description Skeleton */}
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="90%" height={20} />
      <Skeleton variant="text" width="95%" height={20} />
      <Skeleton variant="text" width="30%" height={36} sx={{ mt: 1, mb: 2 }} />

      <Divider sx={{ my: 3 }} />

      {/* Metadata Skeleton */}
      <Grid container spacing={3}>
        {[...Array(8)].map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={20} height={20} sx={{ mr: 1 }} />
              <Skeleton variant="text" width={80} height={20} />
            </Box>
            <Skeleton variant="text" width={120} height={24} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};
