package com.example.boudinboss

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.SharedPreferences
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.webkit.*
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : ComponentActivity() {

    private lateinit var sharedPrefs: SharedPreferences
    private var pendingPermissionRequest: PermissionRequest? = null
    private val CAMERA_PERMISSION_CODE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        sharedPrefs = getSharedPreferences("BoudinBossConfig", Context.MODE_PRIVATE)

        setContent {
            var serverUrl by remember { mutableStateOf(sharedPrefs.getString("server_url", "http://192.168.1.50:5173") ?: "http://192.168.1.50:5173") }
            var deviceRole by remember { mutableStateOf(sharedPrefs.getString("device_role", "tablet") ?: "tablet") }
            var isConfigured by remember { mutableStateOf(sharedPrefs.contains("server_url")) }

            if (!isConfigured) {
                SetupScreen(
                    currentUrl = serverUrl,
                    currentRole = deviceRole,
                    onSave = { url, role ->
                        // persistent save
                        sharedPrefs.edit().apply {
                            putString("server_url", url)
                            putString("device_role", role)
                            apply()
                        }
                        serverUrl = url
                        deviceRole = role
                        isConfigured = true
                    }
                )
            } else {
                val targetUrl = remember(serverUrl, deviceRole) {
                    val base = serverUrl.trimEnd('/')
                    when (deviceRole) {
                        "tablet" -> "$base/tablet"
                        "admin" -> "$base/admin"
                        else -> "$base/dashboard"
                    }
                }

                Box(modifier = Modifier.fillMaxSize()) {
                    WebViewContainer(
                        url = targetUrl,
                        onResetConfig = {
                            // Reset SharedPreferences
                            sharedPrefs.edit().clear().apply()
                            isConfigured = false
                        }
                    )
                }
            }
        }
    }

    // Handle WebView camera permission result
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == CAMERA_PERMISSION_CODE) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                pendingPermissionRequest?.let {
                    it.grant(it.resources)
                }
            } else {
                pendingPermissionRequest?.deny()
            }
            pendingPermissionRequest = null
        }
    }

    fun requestCameraPermissionNatively(request: PermissionRequest) {
        pendingPermissionRequest = request
        ActivityCompat.requestPermissions(
            this,
            arrayOf(Manifest.permission.CAMERA),
            CAMERA_PERMISSION_CODE
        )
    }
}

@Composable
fun SetupScreen(
    currentUrl: String,
    currentRole: String,
    onSave: (String, String) -> Unit
) {
    var urlInput by remember { mutableStateOf(currentUrl) }
    var selectedRole by remember { mutableStateOf(currentRole) }
    val scrollState = rememberScrollState()

    // Smoky Cajun colors
    val darkCharcoal = Color(0xFF121212)
    val crimsonRed = Color(0xFFC70039)
    val goldAccent = Color(0xFFFFC300)
    val cardBackground = Color(0xFF1E1E1E)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(darkCharcoal)
            .verticalScroll(scrollState)
            .padding(24.dp)
            .safeDrawingPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // App Title Banner
        Spacer(modifier = Modifier.height(20.dp))
        Text(
            text = "🔥 BOUDIN BOSS 🔥",
            color = crimsonRed,
            fontSize = 32.sp,
            fontWeight = FontWeight.Black,
            textAlign = TextAlign.Center
        )
        Text(
            text = "UNIVERSAL TERMINAL SETUP",
            color = Color.White,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 2.sp,
            modifier = Modifier.padding(top = 4.dp),
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(30.dp))

        // Device Role Card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(cardBackground)
                .border(1.dp, crimsonRed.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Text(
                text = "1. SELECT DEVICE CONFIGURATION",
                color = goldAccent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
            Text(
                text = "Configure this screen for the specific terminal role.",
                color = Color.Gray,
                fontSize = 10.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Dynamic card selectors
            val roles = listOf(
                Triple("tablet", "Tablet Counter", "Customer loyalty check-in scans & cashiers PIN portal"),
                Triple("admin", "Admin / Manager", "Full remote dashboard, reports, audits, and settings"),
                Triple("customer", "Customer Portal", "Simulate standard guest rewards status & specials feed")
            )

            roles.forEach { (roleKey, title, desc) ->
                val isSelected = selectedRole == roleKey
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(if (isSelected) crimsonRed.copy(alpha = 0.2f) else darkCharcoal.copy(alpha = 0.5f))
                        .border(
                            width = if (isSelected) 2.dp else 1.dp,
                            color = if (isSelected) crimsonRed else Color.DarkGray,
                            shape = RoundedCornerShape(16.dp)
                        )
                        .clickable { selectedRole = roleKey }
                        .padding(16.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(
                                selected = isSelected,
                                onClick = { selectedRole = roleKey },
                                colors = RadioButtonDefaults.colors(
                                    selectedColor = crimsonRed,
                                    unselectedColor = Color.Gray
                                )
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = title,
                                color = Color.White,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                        Text(
                            text = desc,
                            color = Color.LightGray,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(start = 48.dp, top = 2.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // Connection Card
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(24.dp))
                .background(cardBackground)
                .border(1.dp, crimsonRed.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                .padding(20.dp)
        ) {
            Text(
                text = "2. DEFINE REWARDS SERVER ADDRESS",
                color = goldAccent,
                fontSize = 12.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
            Text(
                text = "Input the LAN IP address or server URL.",
                color = Color.Gray,
                fontSize = 10.sp,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            OutlinedTextField(
                value = urlInput,
                onValueChange = { urlInput = it },
                label = { Text("Server URL", color = Color.Gray) },
                singleLine = true,
                textStyle = MaterialTheme.typography.bodyMedium.copy(color = Color.White, fontWeight = FontWeight.Bold),
                modifier = Modifier.fillMaxWidth()
            )
            Text(
                text = "Example: http://192.168.1.50:5173",
                color = Color.DarkGray,
                fontSize = 9.sp,
                modifier = Modifier.padding(top = 4.dp, start = 4.dp),
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(30.dp))

        // Connect Button
        Button(
            onClick = {
                if (urlInput.isNotBlank()) {
                    onSave(urlInput, selectedRole)
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = crimsonRed),
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp)
        ) {
            Text(
                text = "LAUNCH TERMINAL PORTAL",
                color = Color.White,
                fontSize = 14.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp
            )
        }
        Spacer(modifier = Modifier.height(40.dp))
    }
}

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewContainer(
    url: String,
    onResetConfig: () -> Unit
) {
    val context = LocalContext.current
    val webView = remember { WebView(context) }
    var isLoading by remember { mutableStateOf(true) }
    var showResetConfirmation by remember { mutableStateOf(false) }

    // Intercept hardware Back Button inside WebView
    BackHandler {
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            // Confirm reset dialog if they back out completely
            showResetConfirmation = true
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            factory = { ctx ->
                webView.apply {
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT
                    )

                    // Hardware-acceleration
                    setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)

                    // Robust Settings
                    settings.javaScriptEnabled = true
                    settings.domStorageEnabled = true
                    settings.databaseEnabled = true
                    settings.allowFileAccess = true
                    settings.allowContentAccess = true
                    settings.loadWithOverviewMode = true
                    settings.useWideViewPort = true
                    settings.mediaPlaybackRequiresUserGesture = false

                    // Support geolocation
                    settings.setGeolocationEnabled(true)

                    webViewClient = object : WebViewClient() {
                        override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                            isLoading = true
                        }

                        override fun onPageFinished(view: WebView?, url: String?) {
                            isLoading = false
                        }

                        override fun onReceivedError(
                            view: WebView?,
                            request: WebResourceRequest?,
                            error: WebResourceError?
                        ) {
                            Log.e("WebView", "Received error: ${error?.description}")
                        }
                    }

                    webChromeClient = object : WebChromeClient() {
                        // Native Camera permission request intercept!
                        override fun onPermissionRequest(request: PermissionRequest) {
                            val activity = context as? MainActivity
                            if (activity != null) {
                                // Check if camera is requested
                                if (request.resources.contains(PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                                    val hasCamera = ContextCompat.checkSelfPermission(
                                        context,
                                        Manifest.permission.CAMERA
                                    ) == PackageManager.PERMISSION_GRANTED

                                    if (hasCamera) {
                                        request.grant(request.resources)
                                    } else {
                                        activity.requestCameraPermissionNatively(request)
                                    }
                                } else {
                                    request.grant(request.resources)
                                }
                            } else {
                                request.deny()
                            }
                        }

                        override fun onGeolocationPermissionsShowPrompt(
                            origin: String?,
                            callback: GeolocationPermissions.Callback?
                        ) {
                            callback?.invoke(origin, true, false)
                        }
                    }

                    loadUrl(url)
                }
            },
            update = {
                // Ensure correct URL loads if updated
            },
            modifier = Modifier.fillMaxSize()
        )

        // Loading Overlay
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color(0xFF121212).copy(alpha = 0.8f)),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator(color = Color(0xFFC70039))
            }
        }

        // Hidden gear button in the corner (translucent and elegant emoji gear button)
        Box(
            modifier = Modifier
                .align(Alignment.TopEnd)
                .safeDrawingPadding()
                .padding(16.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(Color.Black.copy(alpha = 0.4f))
                .clickable { showResetConfirmation = true }
                .padding(10.dp)
        ) {
            Text(
                text = "⚙️",
                fontSize = 20.sp,
                color = Color.White
            )
        }

        // Configuration Reset Dialog
        if (showResetConfirmation) {
            AlertDialog(
                onDismissRequest = { showResetConfirmation = false },
                title = {
                    Text(
                        text = "Reset Terminal Role?",
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )
                },
                text = {
                    Text(
                        text = "This will disconnect the terminal from the server and return to the Setup Portal selector.",
                        color = Color.LightGray
                    )
                },
                confirmButton = {
                    Button(
                        onClick = {
                            showResetConfirmation = false
                            onResetConfig()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFC70039))
                    ) {
                        Text("Reset Connection", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showResetConfirmation = false }) {
                        Text("Cancel", color = Color.Gray, fontWeight = FontWeight.Bold)
                    }
                },
                containerColor = Color(0xFF1E1E1E),
                shape = RoundedCornerShape(24.dp)
            )
        }
    }
}
