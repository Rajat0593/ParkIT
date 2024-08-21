package com.example.parkit;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
import android.view.animation.BounceInterpolator;
import android.view.animation.ScaleAnimation;
import android.view.animation.TranslateAnimation;
import android.widget.ImageView;
import android.widget.TextView;

public class MainActivity extends AppCompatActivity {

    private ImageView carImageView;
    private ImageView parkingLotImageView;
    private TextView appNameTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        carImageView = findViewById(R.id.carImageView);
        parkingLotImageView = findViewById(R.id.parkingLotImageView);
        appNameTextView = findViewById(R.id.appNameTextView);

        parkingLotImageView.bringToFront();

        // Create the translate animation for the car
        TranslateAnimation carDriveAnimation = new TranslateAnimation(
                Animation.RELATIVE_TO_PARENT, 0.0f,
                Animation.RELATIVE_TO_PARENT, -1.0f,
                Animation.RELATIVE_TO_SELF, 0.0f,
                Animation.RELATIVE_TO_SELF, 0.0f);
        carDriveAnimation.setDuration(2000);
        carDriveAnimation.setFillAfter(true);

        // Set animation listener to clear the screen after the car animation
        carDriveAnimation.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) {}

            @Override
            public void onAnimationEnd(Animation animation) {
                carImageView.setVisibility(ImageView.GONE);
                parkingLotImageView.setVisibility(ImageView.GONE);

                // Show and animate the app name
                appNameTextView.setVisibility(TextView.VISIBLE);

                // Create the alpha animation for the app name
                AlphaAnimation fadeInAnimation = new AlphaAnimation(0.0f, 1.0f);
                fadeInAnimation.setDuration(1000);

                // Start the app name animation
                appNameTextView.startAnimation(fadeInAnimation);
            }

            @Override
            public void onAnimationRepeat(Animation animation) {}
        });

        // Start the car drive animation
        carImageView.startAnimation(carDriveAnimation);
    }
}