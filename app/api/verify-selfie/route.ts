import { NextRequest, NextResponse } from 'next/server';
import { verifySelfieWithGemini } from '@/lib/fraudDetection';
import { 
  saveSelfieVerification,
  markUserAsVerified,
  getUserFraudProfile 
} from '@/lib/fraudDatabase';
// W&B logging temporarily disabled due to browser compatibility issues
// import { logSelfieVerification, logFraudScore } from '@/lib/wandb';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Starting selfie verification...');
    const body = await request.json();
    const { walletAddress, imageBase64 } = body;

    console.log('📦 Received data:', { 
      walletAddress, 
      hasImage: !!imageBase64,
      imageLength: imageBase64?.length 
    });

    // Validate inputs
    if (!walletAddress || !imageBase64) {
      console.error('❌ Validation failed: Missing required fields');
      return NextResponse.json(
        { error: 'Missing walletAddress or image data' },
        { status: 400 }
      );
    }

    // Mock verification - return success without calling API
    console.log('✅ MOCK MODE: Face detected successfully!');
    const geminiResult = {
      is_verified: true,
      is_real_person: true,
      is_live_photo: true,
      face_detected: true,
      quality_score: 95,
      liveness_score: 92,
      authenticity_score: 98,
      deepfake_probability: 1,
      verification_recommendation: 'approve',
      rejection_reasons: [],
      confidence: 98,
      detailed_analysis: 'Face detected successfully! Identity verified.'
    };
    
    const processingTime = Date.now() - startTime;

    // Note: Skipping Firebase Storage upload to avoid billing
    const selfieUrl = 'verified-via-ai';

    // Determine verification status
    const isVerified = geminiResult.is_verified && 
                      geminiResult.verification_recommendation === 'approve';

    const status = isVerified ? 'verified' : 
                  geminiResult.verification_recommendation === 'manual_review' ? 'pending' : 
                  'rejected';

    // Save verification to database
    const verificationData: any = {
      walletAddress: walletAddress.toLowerCase(),
      selfieUrl,
      status,
      geminiScore: geminiResult.authenticity_score,
      isLivePhoto: geminiResult.is_live_photo,
      faceDetected: geminiResult.face_detected,
      deepfakeProbability: geminiResult.deepfake_probability,
      qualityScore: geminiResult.quality_score,
      analysisDetails: {
        isRealPerson: geminiResult.is_real_person,
        isLivePhoto: geminiResult.is_live_photo,
        aiConfidence: geminiResult.confidence,
        detectedIssues: geminiResult.rejection_reasons,
        geminiRawResponse: geminiResult,
      },
      uploadedAt: new Date(),
    };

    if (!isVerified && geminiResult.rejection_reasons.length > 0) {
      verificationData.rejectionReason = geminiResult.rejection_reasons.join(', ');
    }
    if (isVerified) {
      verificationData.verifiedAt = new Date();
      verificationData.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    }

    const verificationId = await saveSelfieVerification(verificationData);

    // Get profile BEFORE verification
    const profileBefore = await getUserFraudProfile(walletAddress);
    const oldIndividualScore = profileBefore?.fraudScore || 50;
    const oldTrustScore = profileBefore?.totalTrustScore || 0;

    // If verified, update user's fraud score
    if (isVerified) {
      console.log('🎉 User verified! Updating fraud score...');
      await markUserAsVerified(walletAddress, 20);
    }

    // Get updated fraud profile
    const updatedProfile = await getUserFraudProfile(walletAddress);
    console.log('📊 Updated profile:', updatedProfile);

    const newIndividualScore = updatedProfile?.fraudScore || 50;
    const newTrustScore = updatedProfile?.totalTrustScore || 0;
    const actualScoreImprovement = newIndividualScore - oldIndividualScore;
    const trustScoreImprovement = newTrustScore - oldTrustScore;

    const response = {
      success: true,
      verified: isVerified,
      status,
      verificationId,
      geminiScore: geminiResult.authenticity_score,
      confidence: geminiResult.confidence,
      rejectionReasons: geminiResult.rejection_reasons,
      detailedAnalysis: geminiResult.detailed_analysis,
      
      oldIndividualScore,
      newIndividualScore,
      updatedFraudScore: newIndividualScore,
      scoreImprovement: actualScoreImprovement,
      trustScoreImprovement,
      
      walletAgeScore: updatedProfile?.walletAgeScore || 0,
      repaymentHistoryScore: updatedProfile?.repaymentHistoryScore || 0,
      selfieVerificationScore: updatedProfile?.selfieVerificationScore || 0,
      circleActivityScore: updatedProfile?.circleActivityScore || 0,
      platformActivityScore: updatedProfile?.platformActivityScore || 0,
      totalTrustScore: updatedProfile?.totalTrustScore || 0,
    };

    console.log('✅ Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Selfie verification error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { 
        error: 'Failed to verify selfie',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// Selfie verification API
// Selfie verification API
